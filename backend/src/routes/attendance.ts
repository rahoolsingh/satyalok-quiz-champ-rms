import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Attendance, AttendanceLog, Participant } from '../db/models';
import mongoose from 'mongoose';

export const attendanceRouter = Router();

// Apply admin auth to all attendance routes
attendanceRouter.use(authMiddleware);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in IST (UTC+5:30) */
function getTodayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

/** Returns current IST datetime */
function getNowIST(): Date {
  return new Date();
}

interface ParsedQR {
  id: string;
  roll: string;
  name: string;
  guardian: string;
  class: string;
  batch: string;
  mobile: string;
}

function parseQRData(raw: string): ParsedQR | null {
  try {
    const data = JSON.parse(raw);
    if (!data.id || !data.roll || !data.batch) return null;
    return data as ParsedQR;
  } catch {
    return null;
  }
}

async function markAttendance(
  participantId: mongoose.Types.ObjectId,
  participant: InstanceType<typeof Participant>,
  method: 'QR' | 'MANUAL',
  adminId: string,
  req: AuthRequest,
  qrData?: string
) {
  const todayDate = getTodayIST();
  const now = getNowIST();
  const deviceInfo = req.headers['user-agent'] || 'Unknown';
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

  // Check duplicate
  const existing = await Attendance.findOne({ participantId, checkInDate: todayDate });
  if (existing) {
    // Increment duplicate attempt counter
    await Attendance.updateOne({ _id: existing._id }, { $inc: { duplicateAttempts: 1 } });
    // Log duplicate
    await AttendanceLog.create({
      participantId,
      rollNumber: participant.rollNumber,
      action: method === 'QR' ? 'SCAN_DUPLICATE' : 'MANUAL_DUPLICATE',
      timestamp: now,
      scannedBy: new mongoose.Types.ObjectId(adminId),
      qrData,
      deviceInfo,
      ipAddress,
    });
    return { duplicate: true, existing };
  }

  // Create attendance record
  const attendance = await Attendance.create({
    participantId,
    rollNumber: participant.rollNumber,
    name: participant.name,
    batchType: participant.batchType,
    class: participant.class,
    mobileNumber: participant.mobileNumber,
    photoUrl: participant.photoUrl,
    checkInTime: now,
    checkInDate: todayDate,
    scannedBy: new mongoose.Types.ObjectId(adminId),
    scanMethod: method,
    qrData,
    deviceInfo,
    duplicateAttempts: 0,
  });

  // Update participant attendance flags
  await Participant.updateOne(
    { _id: participantId },
    { $set: { attendanceMarked: true, lastAttendanceDate: now } }
  );

  // Log success
  await AttendanceLog.create({
    participantId,
    rollNumber: participant.rollNumber,
    action: method === 'QR' ? 'SCAN_SUCCESS' : 'MANUAL_ENTRY',
    timestamp: now,
    scannedBy: new mongoose.Types.ObjectId(adminId),
    qrData,
    deviceInfo,
    ipAddress,
  });

  return { duplicate: false, attendance };
}

// ─── POST /api/attendance/scan ────────────────────────────────────────────────
// Mark attendance by scanning QR code data
attendanceRouter.post('/scan', async (req: AuthRequest, res: Response) => {
  try {
    const { qrData } = req.body;
    const adminId = req.adminId!;

    if (!qrData) {
      return res.status(400).json({ error: 'QR code data is required' });
    }

    const parsed = parseQRData(qrData);
    if (!parsed) {
      return res.status(400).json({
        error: 'INVALID_QR',
        message: 'This QR code is not valid. Please ensure you\'re scanning a Quiz Champ admit card.',
      });
    }

    // Look up participant by ID from QR
    let participant;
    try {
      participant = await Participant.findById(parsed.id);
    } catch {
      participant = null;
    }

    // Fallback: look up by roll number
    if (!participant && parsed.roll) {
      participant = await Participant.findOne({ rollNumber: parsed.roll });
    }

    if (!participant) {
      await AttendanceLog.create({
        action: 'SCAN_ERROR',
        timestamp: new Date(),
        scannedBy: new mongoose.Types.ObjectId(adminId),
        qrData,
        errorMessage: 'Participant not found',
        deviceInfo: req.headers['user-agent'] || 'Unknown',
      });
      return res.status(404).json({
        error: 'PARTICIPANT_NOT_FOUND',
        message: 'Participant not found. Please verify the admit card and try again.',
      });
    }

    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(403).json({
        error: 'PAYMENT_INCOMPLETE',
        message: 'Registration payment is incomplete. Please complete payment before attending.',
      });
    }

    const result = await markAttendance(
      participant._id as mongoose.Types.ObjectId,
      participant,
      'QR',
      adminId,
      req,
      qrData
    );

    if (result.duplicate) {
      return res.status(409).json({
        error: 'DUPLICATE_ATTENDANCE',
        message: `Already marked present at ${result.existing!.checkInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}. Attendance can only be marked once per day.`,
        previousAttendance: {
          checkInTime: result.existing!.checkInTime,
          checkInDate: result.existing!.checkInDate,
          name: result.existing!.name,
          rollNumber: result.existing!.rollNumber,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: result.attendance,
      participant: {
        name: participant.name,
        rollNumber: participant.rollNumber,
        class: participant.class,
        batchType: participant.batchType,
        photoUrl: participant.photoUrl,
      },
    });
  } catch (err) {
    console.error('[attendance/scan]', err);
    return res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// ─── POST /api/attendance/manual ─────────────────────────────────────────────
// Mark attendance manually by roll number
attendanceRouter.post('/manual', async (req: AuthRequest, res: Response) => {
  try {
    const { rollNumber, notes } = req.body;
    const adminId = req.adminId!;

    if (!rollNumber || !rollNumber.trim()) {
      return res.status(400).json({ error: 'Roll number is required' });
    }

    const participant = await Participant.findOne({ rollNumber: rollNumber.trim().toUpperCase() });

    if (!participant) {
      await AttendanceLog.create({
        rollNumber: rollNumber.trim(),
        action: 'SCAN_ERROR',
        timestamp: new Date(),
        scannedBy: new mongoose.Types.ObjectId(adminId),
        errorMessage: 'Participant not found by roll number',
        deviceInfo: req.headers['user-agent'] || 'Unknown',
      });
      return res.status(404).json({
        error: 'PARTICIPANT_NOT_FOUND',
        message: `No participant found with roll number ${rollNumber.trim()}. Please verify and try again.`,
      });
    }

    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(403).json({
        error: 'PAYMENT_INCOMPLETE',
        message: 'Registration payment is incomplete.',
      });
    }

    const result = await markAttendance(
      participant._id as mongoose.Types.ObjectId,
      participant,
      'MANUAL',
      adminId,
      req
    );

    if (result.duplicate) {
      return res.status(409).json({
        error: 'DUPLICATE_ATTENDANCE',
        message: `Already marked present at ${result.existing!.checkInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}. Attendance can only be marked once per day.`,
        previousAttendance: {
          checkInTime: result.existing!.checkInTime,
          checkInDate: result.existing!.checkInDate,
          name: result.existing!.name,
          rollNumber: result.existing!.rollNumber,
        },
      });
    }

    // Update notes if provided
    if (notes && result.attendance) {
      await Attendance.updateOne({ _id: result.attendance._id }, { $set: { notes } });
    }

    return res.json({
      success: true,
      message: 'Attendance marked successfully (manual entry)',
      attendance: result.attendance,
      participant: {
        name: participant.name,
        rollNumber: participant.rollNumber,
        class: participant.class,
        batchType: participant.batchType,
        photoUrl: participant.photoUrl,
      },
    });
  } catch (err) {
    console.error('[attendance/manual]', err);
    return res.status(500).json({ error: 'Failed to record manual attendance' });
  }
});

// ─── GET /api/attendance/stats ────────────────────────────────────────────────
// Get real-time attendance statistics for a given date
attendanceRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query as Record<string, string>;
    const targetDate = date || getTodayIST();

    const [
      totalRegistrations,
      juniorRegistrations,
      seniorRegistrations,
      totalAttendance,
      juniorAttendance,
      seniorAttendance,
    ] = await Promise.all([
      Participant.countDocuments({ paymentStatus: 'COMPLETED' }),
      Participant.countDocuments({ paymentStatus: 'COMPLETED', batchType: 'JUNIOR' }),
      Participant.countDocuments({ paymentStatus: 'COMPLETED', batchType: 'SENIOR' }),
      Attendance.countDocuments({ checkInDate: targetDate }),
      Attendance.countDocuments({ checkInDate: targetDate, batchType: 'JUNIOR' }),
      Attendance.countDocuments({ checkInDate: targetDate, batchType: 'SENIOR' }),
    ]);

    const attendancePercentage =
      totalRegistrations > 0 ? Math.round((totalAttendance / totalRegistrations) * 100) : 0;
    const juniorPercentage =
      juniorRegistrations > 0 ? Math.round((juniorAttendance / juniorRegistrations) * 100) : 0;
    const seniorPercentage =
      seniorRegistrations > 0 ? Math.round((seniorAttendance / seniorRegistrations) * 100) : 0;

    return res.json({
      stats: {
        date: targetDate,
        totalRegistrations,
        totalAttendance,
        attendancePercentage,
        juniorRegistrations,
        juniorAttendance,
        juniorPercentage,
        seniorRegistrations,
        seniorAttendance,
        seniorPercentage,
        lastUpdated: new Date(),
      },
    });
  } catch (err) {
    console.error('[attendance/stats]', err);
    return res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
});

// ─── GET /api/attendance/list ─────────────────────────────────────────────────
// Get attendance records with filters
attendanceRouter.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const {
      batchType,
      status = 'PRESENT',
      search,
      sortBy = 'checkInTime',
      sortOrder = 'desc',
      page = '1',
      limit = '50',
      date,
    } = req.query as Record<string, string>;

    const todayDate = date || getTodayIST();
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    if (status === 'ABSENT') {
      // Return registered participants who have NO attendance today
      const attendedIds = await Attendance.distinct('participantId', { checkInDate: todayDate });

      const participantQuery: Record<string, unknown> = {
        paymentStatus: 'COMPLETED',
        _id: { $nin: attendedIds },
      };
      if (batchType && (batchType === 'JUNIOR' || batchType === 'SENIOR')) {
        participantQuery.batchType = batchType;
      }
      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        participantQuery.$or = [{ name: regex }, { rollNumber: regex }];
      }

      const [absentees, total] = await Promise.all([
        Participant.find(participantQuery)
          .sort({ rollNumber: 1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Participant.countDocuments(participantQuery),
      ]);

      return res.json({
        records: absentees.map((p) => ({
          participantId: p._id.toString(),
          rollNumber: p.rollNumber,
          name: p.name,
          class: p.class,
          batchType: p.batchType,
          mobileNumber: p.mobileNumber,
          photoUrl: p.photoUrl,
          status: 'ABSENT',
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    }

    // PRESENT records
    const query: Record<string, unknown> = { checkInDate: todayDate };
    if (batchType && (batchType === 'JUNIOR' || batchType === 'SENIOR')) {
      query.batchType = batchType;
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: regex }, { rollNumber: regex }];
    }

    const sortField = ['checkInTime', 'rollNumber', 'name'].includes(sortBy) ? sortBy : 'checkInTime';
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [records, total] = await Promise.all([
      Attendance.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Attendance.countDocuments(query),
    ]);

    return res.json({
      records: records.map((r) => ({
        attendanceId: r._id.toString(),
        participantId: r.participantId.toString(),
        rollNumber: r.rollNumber,
        name: r.name,
        class: r.class,
        batchType: r.batchType,
        mobileNumber: r.mobileNumber,
        photoUrl: r.photoUrl,
        checkInTime: r.checkInTime,
        checkInDate: r.checkInDate,
        scanMethod: r.scanMethod,
        status: 'PRESENT',
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[attendance/list]', err);
    return res.status(500).json({ error: 'Failed to fetch attendance list' });
  }
});

// ─── GET /api/attendance/export ───────────────────────────────────────────────
// Export attendance data as CSV
attendanceRouter.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const { batchType, status = 'PRESENT', date } = req.query as Record<string, string>;
    const todayDate = date || getTodayIST();

    let csvRows: string[] = [];
    const filename = `attendance-${todayDate}.csv`;

    if (status === 'ABSENT') {
      const attendedIds = await Attendance.distinct('participantId', { checkInDate: todayDate });
      const query: Record<string, unknown> = {
        paymentStatus: 'COMPLETED',
        _id: { $nin: attendedIds },
      };
      if (batchType && (batchType === 'JUNIOR' || batchType === 'SENIOR')) {
        query.batchType = batchType;
      }

      const absentees = await Participant.find(query).sort({ rollNumber: 1 }).lean();

      csvRows = [
        `Date,${todayDate}`,
        `Status,ABSENT`,
        `Total Absentees,${absentees.length}`,
        '',
        'Roll Number,Name,Class,Batch,Mobile Number',
        ...absentees.map((p) =>
          [p.rollNumber || '', `"${p.name}"`, p.class, p.batchType, p.mobileNumber].join(',')
        ),
      ];
    } else {
      const query: Record<string, unknown> = { checkInDate: todayDate };
      if (batchType && (batchType === 'JUNIOR' || batchType === 'SENIOR')) {
        query.batchType = batchType;
      }

      const records = await Attendance.find(query).sort({ checkInTime: 1 }).lean();

      // Build summary counts
      const junior = records.filter((r) => r.batchType === 'JUNIOR').length;
      const senior = records.filter((r) => r.batchType === 'SENIOR').length;

      csvRows = [
        `Date,${todayDate}`,
        `Total Attendance,${records.length}`,
        `Junior,${junior}`,
        `Senior,${senior}`,
        '',
        'Roll Number,Name,Class,Batch,Mobile Number,Check-in Time,Scan Method',
        ...records.map((r) =>
          [
            r.rollNumber,
            `"${r.name}"`,
            r.class,
            r.batchType,
            r.mobileNumber,
            new Date(r.checkInTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            r.scanMethod,
          ].join(',')
        ),
      ];
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('[attendance/export]', err);
    return res.status(500).json({ error: 'Failed to export attendance data' });
  }
});

// ─── GET /api/attendance/participant/:id ──────────────────────────────────────
// Get attendance history for a specific participant
attendanceRouter.get('/participant/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const participant = await Participant.findById(id).lean();
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const records = await Attendance.find({ participantId: id })
      .sort({ checkInTime: -1 })
      .lean();

    return res.json({
      participant: {
        name: participant.name,
        rollNumber: participant.rollNumber,
        class: participant.class,
        batchType: participant.batchType,
        mobileNumber: participant.mobileNumber,
        photoUrl: participant.photoUrl,
        attendanceMarked: participant.attendanceMarked,
      },
      attendance: records,
    });
  } catch (err) {
    console.error('[attendance/participant]', err);
    return res.status(500).json({ error: 'Failed to fetch participant attendance' });
  }
});
