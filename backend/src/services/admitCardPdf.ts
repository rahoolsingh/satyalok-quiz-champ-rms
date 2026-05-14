import PDFDocument from "pdfkit";
import axios from "axios";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

interface AdmitCardData {
    rollNumber: string;
    name: string;
    class: string;
    batchType: string;
    guardianName: string;
    mobileNumber: string;
    photoUrl?: string;
    eventName?: string;
    eventDate?: string;
    eventTime?: string;
    venue?: string;
    venueMapUrl?: string;
    ipAddress?: string;
}

export async function generateAdmitCardPDF(
    data: AdmitCardData,
): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                autoFirstPage: true,
            });

            const buffers: Buffer[] = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", reject);

            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 40;
            const contentWidth = pageWidth - margin * 2;

            // Orange Theme Palette
            const colors = {
                brand: "#ea580c", // Orange 600
                primary: "#1e293b", // Slate 800
                secondary: "#475569", // Slate 600
                border: "#fdba74", // Orange 300
                bgLight: "#fff7ed", // Orange 50
                accent: "#ffedd5", // Orange 100
            };

            // Main Outer Boundary
            doc.roundedRect(margin, margin, contentWidth, 570, 8)
                .lineWidth(1.5)
                .strokeColor(colors.brand)
                .stroke();

            // ========== HEADER SECTION ==========
            const publicAssetsDir = path.join(
                process.cwd(),
                "public",
                "assets",
            );

            // Header Background
            doc.roundedRect(
                margin + 1.5,
                margin + 1.5,
                contentWidth - 3,
                85,
                6,
            ).fill(colors.bgLight);
            doc.rect(margin + 1.5, margin + 70, contentWidth - 3, 16).fill(
                colors.bgLight,
            ); // Flatten bottom
            doc.moveTo(margin, margin + 86)
                .lineTo(pageWidth - margin, margin + 86)
                .lineWidth(1)
                .strokeColor(colors.border)
                .stroke();

            // Logos object fill - contain
            const satyalokLogoPath = path.join(publicAssetsDir, "satyalok.png");
            if (fs.existsSync(satyalokLogoPath)) {
                doc.image(satyalokLogoPath, margin + 20, margin + 15, {
                    height: 55,
                    width: 80,
                    fit: [55, 80],
                    valign: "center",
                });
            }

            const competitionLogoPath = path.join(publicAssetsDir, "logo.png");
            if (fs.existsSync(competitionLogoPath)) {
                doc.image(
                    competitionLogoPath,
                    pageWidth - margin - 75,
                    margin + 15,
                    { width: 55, height: 55, fit: [55, 55], valign: "center" },
                );
            }

            // Header Text
            doc.fontSize(18)
                .fillColor(colors.brand)
                .font("Helvetica-Bold")
                .text("SATYALOK - A New Hope", margin, margin + 25, {
                    width: contentWidth,
                    align: "center",
                });

            doc.fontSize(11)
                .fillColor(colors.primary)
                .font("Helvetica")
                .text(
                    data.eventName || "QUIZ CHAMP 2026",
                    margin,
                    margin + 48,
                    { width: contentWidth, align: "center" },
                );

            // Badge for Admit Card Type
            const badgeW = 200;
            const badgeX = (pageWidth - badgeW) / 2;
            doc.roundedRect(badgeX, margin + 74, badgeW, 24, 12).fill(
                colors.brand,
            );
            // junior or senior hall ticket
            doc.fontSize(10)
                .fillColor("#ffffff")
                .font("Helvetica-Bold")
                .text(
                    data.batchType === "JUNIOR"
                        ? "JUNIOR ADMIT CARD"
                        : "SENIOR ADMIT CARD",
                    badgeX,
                    margin + 82,
                    {
                        width: badgeW,
                        align: "center",
                    },
                );

            // ========== PARTICIPANT DETAILS ==========
            let currentY = margin + 115;

            const photoWidth = 100;
            const photoHeight = 125;
            const photoX = pageWidth - margin - photoWidth - 20;

            const labelX = margin + 25;
            const valueX = margin + 140;

            const addDetail = (label: string, value: string, y: number) => {
                doc.fontSize(9)
                    .fillColor(colors.secondary)
                    .font("Helvetica")
                    .text(label, labelX, y);
                doc.fontSize(10)
                    .fillColor(colors.primary)
                    .font("Helvetica-Bold")
                    .text(value, valueX, y, { width: photoX - valueX - 10 });
                doc.moveTo(labelX, y + 18)
                    .lineTo(photoX - 20, y + 18)
                    .lineWidth(0.5)
                    .strokeColor(colors.accent)
                    .stroke();
                return y + 26;
            };

            currentY = addDetail("Roll Number", data.rollNumber, currentY);
            currentY = addDetail("Candidate Name", data.name, currentY);
            currentY = addDetail("Class", data.class, currentY);
            currentY = addDetail(
                "Batch Category",
                data.batchType === "JUNIOR"
                    ? "Junior Batch (5-10)"
                    : "Senior Batch (10+)",
                currentY,
            );
            currentY = addDetail("Guardian Name", data.guardianName, currentY);
            currentY = addDetail(
                "Mobile Number",
                `+91 ${data.mobileNumber}`,
                currentY,
            );

            // Fetch and Cache Photo Buffer
            let fetchedPhotoBuffer: Buffer | null = null;
            if (data.photoUrl) {
                try {
                    const photoResponse = await axios.get(data.photoUrl, {
                        responseType: "arraybuffer",
                    });
                    fetchedPhotoBuffer = Buffer.from(photoResponse.data);
                } catch (err) {
                    console.error("Failed to load candidate image", err);
                }
            }

            // Main Photo Box
            doc.roundedRect(
                photoX,
                margin + 115,
                photoWidth,
                photoHeight,
                6,
            ).fill(colors.bgLight);
            doc.roundedRect(photoX, margin + 115, photoWidth, photoHeight, 6)
                .lineWidth(1)
                .strokeColor(colors.border)
                .stroke();

            if (fetchedPhotoBuffer) {
                doc.save();
                doc.roundedRect(
                    photoX,
                    margin + 115,
                    photoWidth,
                    photoHeight,
                    6,
                ).clip();
                doc.image(fetchedPhotoBuffer, photoX, margin + 115, {
                    width: photoWidth,
                    height: photoHeight,
                    align: "center",
                });
                doc.restore();
            } else {
                doc.fontSize(9)
                    .fillColor(colors.secondary)
                    .text(
                        "Paste Recent\nPassport\nPhotograph",
                        photoX,
                        margin + 160,
                        { width: photoWidth, align: "center" },
                    );
            }

            // ========== EVENT DETAILS BOX ==========
            currentY = margin + 270;

            const eventBoxHeight = data.venueMapUrl ? 110 : 75;

            doc.roundedRect(
                margin + 20,
                currentY,
                contentWidth - 40,
                eventBoxHeight,
                6,
            ).fill(colors.bgLight);
            doc.roundedRect(
                margin + 20,
                currentY,
                contentWidth - 40,
                eventBoxHeight,
                6,
            )
                .lineWidth(1)
                .strokeColor(colors.border)
                .stroke();

            doc.roundedRect(
                margin + 20,
                currentY,
                contentWidth - 40,
                25,
                6,
            ).fill(colors.accent);
            doc.rect(margin + 20, currentY + 15, contentWidth - 40, 10).fill(
                colors.accent,
            );

            doc.fontSize(10)
                .fillColor(colors.brand)
                .font("Helvetica-Bold")
                .text("EXAMINATION CENTRE DETAILS", margin + 30, currentY + 8);

            currentY += 35;

            // Date & Time
            const eventDateTime =
                data.eventDate && data.eventTime
                    ? `${data.eventDate} at ${data.eventTime}`
                    : data.eventDate || "To be announced";

            doc.fontSize(9)
                .fillColor(colors.secondary)
                .font("Helvetica")
                .text("Date & Time:", margin + 30, currentY);
            doc.fontSize(10)
                .fillColor(colors.primary)
                .font("Helvetica-Bold")
                .text(eventDateTime, margin + 100, currentY, {
                    width: contentWidth - 140,
                });

            currentY += 20;

            // Venue with hyperlink
            doc.fontSize(9)
                .fillColor(colors.secondary)
                .font("Helvetica")
                .text("Venue:", margin + 30, currentY);

            const venueText = data.venue || "To be announced";

            if (data.venueMapUrl && data.venue) {
                // Make venue text clickable
                doc.fontSize(10)
                    .fillColor("#0066cc")
                    .font("Helvetica-Bold")
                    .text(venueText, margin + 100, currentY, {
                        width: contentWidth - 220,
                        link: data.venueMapUrl,
                        underline: true,
                    });

                // Generate QR code for map URL
                currentY += 25;
                const mapQrDataURI = await QRCode.toDataURL(data.venueMapUrl, {
                    errorCorrectionLevel: "M",
                    margin: 1,
                    width: 60,
                    color: { dark: "#000000", light: "#ffffff" },
                });
                const mapQrBuffer = Buffer.from(
                    mapQrDataURI.split(",")[1],
                    "base64",
                );

                // Place map QR code on right side of event details box and in middle vertically with some padding from the text
                const qrSize = 60;
                doc.image(
                    mapQrBuffer,
                    pageWidth - margin - qrSize - 30,
                    currentY - 50,
                    {
                        width: qrSize,
                        height: qrSize,
                    },
                );
            } else {
                doc.fontSize(10)
                    .fillColor(colors.primary)
                    .font("Helvetica-Bold")
                    .text(venueText, margin + 100, currentY, {
                        width: contentWidth - 140,
                    });
            }

            // ========== INSTRUCTIONS SECTION ==========
            currentY = margin + 270 + eventBoxHeight + 20;

            doc.fontSize(11)
                .fillColor(colors.brand)
                .font("Helvetica-Bold")
                .text("Important Instructions", margin + 20, currentY);

            currentY += 20;
            const instructions = [
                "The candidate must carry this printed admit card and a valid school ID.",
                "Report to the venue strictly 30 minutes prior to the examination time.",
                "Use only Blue/Black ballpoint pen. Pencils are strictly prohibited.",
                "Electronic devices and calculators are not allowed inside the hall.",
                "Hand over the bottom tear-off section to the invigilator with the OMR.",
            ];

            doc.fontSize(9).fillColor(colors.primary).font("Helvetica");
            instructions.forEach((instruction) => {
                doc.circle(margin + 25, currentY + 4, 2).fill(colors.brand);
                doc.text(instruction, margin + 35, currentY, {
                    width: contentWidth - 55,
                });
                currentY += 18;
            });

            // ========== SIGNATURES ==========
            const sigY = 590;

            const drawSigLine = (x: number, label: string) => {
                doc.moveTo(x, sigY)
                    .lineTo(x + 120, sigY)
                    .lineWidth(1)
                    .strokeColor(colors.secondary)
                    .stroke();
                doc.fontSize(8)
                    .fillColor(colors.secondary)
                    .font("Helvetica")
                    .text(label, x, sigY + 8, { width: 120, align: "center" });
            };

            drawSigLine(margin + 30, "Candidate's Signature");
            drawSigLine(margin + 195, "Invigilator's Signature");
            drawSigLine(pageWidth - margin - 150, "Authorized Signatory");

            // =========================================================
            // ========== TEAR-OFF SECTION (BOTTOM OF PAGE) ==========
            // =========================================================
            const cutY = 635;

            // Cut Line
            doc.lineWidth(1).strokeColor(colors.brand);
            doc.moveTo(20, cutY)
                .lineTo(pageWidth - 20, cutY)
                .dash(5, { space: 5 })
                .stroke();
            doc.undash();

            doc.fontSize(10).font("Helvetica").fillColor(colors.brand);
            doc.text("✂", 25, cutY - 4);
            doc.fontSize(8)
                .fillColor(colors.secondary)
                .text(
                    "Fold and tear along this line. Staple this portion securely with the OMR sheet.",
                    margin,
                    cutY + 10,
                    { width: contentWidth, align: "center" },
                );

            // Tear off outer box
            const tearOffMargin = 40;
            const tearOffBoxHeight = 135;

            doc.roundedRect(
                tearOffMargin,
                cutY + 25,
                contentWidth,
                tearOffBoxHeight,
                8,
            )
                .lineWidth(1.5)
                .strokeColor(colors.brand)
                .stroke();

            // Label
            doc.roundedRect(tearOffMargin + 1.5, cutY + 26.5, 150, 20, 6).fill(
                colors.brand,
            );
            doc.fontSize(8)
                .font("Helvetica-Bold")
                .fillColor("#ffffff")
                .text("OFFICE COPY / OMR SLIP", tearOffMargin + 10, cutY + 32);

            // Generate QR Code data
            const qrDataPayload = JSON.stringify({
                roll: data.rollNumber,
                name: data.name,
                class: data.class,
                batch: data.batchType,
            });

            const qrDataURI = await QRCode.toDataURL(qrDataPayload, {
                errorCorrectionLevel: "M",
                margin: 0,
                color: { dark: "#000000", light: "#ffffff" },
            });
            const qrBuffer = Buffer.from(qrDataURI.split(",")[1], "base64");

            // Place QR Code
            const qrSize = 80;
            doc.image(qrBuffer, tearOffMargin + 15, cutY + 60, {
                width: qrSize,
                height: qrSize,
            });

            // Candidate details
            let tearOffY = cutY + 60;
            const toX = tearOffMargin + 110;

            const addTearOffDetail = (
                label: string,
                value: string,
                y: number,
            ) => {
                doc.fontSize(8)
                    .font("Helvetica")
                    .fillColor(colors.secondary)
                    .text(label, toX, y);
                doc.fontSize(9)
                    .font("Helvetica-Bold")
                    .fillColor(colors.primary)
                    .text(value, toX + 45, y, { width: 150 });
                return y + 18;
            };

            tearOffY = addTearOffDetail("Roll No:", data.rollNumber, tearOffY);
            tearOffY = addTearOffDetail("Name:", data.name, tearOffY);
            tearOffY += 8;
            tearOffY = addTearOffDetail(
                "Class:",
                `${data.class} (${data.batchType})`,
                tearOffY,
            );

            // ========== MINI PHOTO WITH HOLOGRAM/SKETCHY EFFECT ==========
            const miniPhotoW = 55;
            const miniPhotoH = 70;
            const miniPhotoX = pageWidth - tearOffMargin - miniPhotoW - 120;
            const miniPhotoY = cutY + 55;

            if (fetchedPhotoBuffer) {
                doc.save();
                doc.roundedRect(
                    miniPhotoX,
                    miniPhotoY,
                    miniPhotoW,
                    miniPhotoH,
                    4,
                ).clip();

                // Draw base image
                doc.image(fetchedPhotoBuffer, miniPhotoX, miniPhotoY, {
                    width: miniPhotoW,
                    height: miniPhotoH,
                });

                // --- HOLOGRAM EFFECT START ---
                // 1. Semi-transparent golden gradient overlay
                const holoGradient = doc.linearGradient(
                    miniPhotoX,
                    miniPhotoY,
                    miniPhotoX + miniPhotoW,
                    miniPhotoY + miniPhotoH,
                );
                holoGradient.stop(0, "#fcd34d", 0.4); // Golden with opacity
                holoGradient.stop(1, "#ea580c", 0.5); // Orange with opacity
                doc.rect(miniPhotoX, miniPhotoY, miniPhotoW, miniPhotoH).fill(
                    holoGradient,
                );

                // 2. Sketchy / Security micro-printing mesh (diagonal lines)
                doc.lineWidth(0.5).strokeOpacity(0.4);
                for (let i = 0; i < miniPhotoW + miniPhotoH; i += 3) {
                    doc.moveTo(miniPhotoX + i, miniPhotoY)
                        .lineTo(miniPhotoX, miniPhotoY + i)
                        .strokeColor("#fef3c7")
                        .stroke();
                }
                // --- HOLOGRAM EFFECT END ---

                doc.restore();

                // Reset opacities just in case, then draw border
                doc.fillOpacity(1).strokeOpacity(1);
                doc.roundedRect(
                    miniPhotoX,
                    miniPhotoY,
                    miniPhotoW,
                    miniPhotoH,
                    4,
                )
                    .lineWidth(1)
                    .strokeColor(colors.brand)
                    .stroke();
            } else {
                doc.roundedRect(
                    miniPhotoX,
                    miniPhotoY,
                    miniPhotoW,
                    miniPhotoH,
                    4,
                )
                    .lineWidth(1)
                    .strokeColor(colors.border)
                    .stroke();
                doc.fontSize(6)
                    .fillColor(colors.secondary)
                    .text("Photo", miniPhotoX, miniPhotoY + 30, {
                        width: miniPhotoW,
                        align: "center",
                    });
            }

            // Invigilator Signature Box
            doc.roundedRect(
                pageWidth - tearOffMargin - 100,
                cutY + 55,
                85,
                70,
                4,
            )
                .lineWidth(1)
                .strokeColor(colors.border)
                .stroke();
            doc.fontSize(7)
                .font("Helvetica")
                .fillColor(colors.secondary)
                .text(
                    "Invigilator Sign & Stamp",
                    pageWidth - tearOffMargin - 100,
                    cutY + 110,
                    { width: 85, align: "center" },
                );

            // ========== FOOTER WITH IP ADDRESS ==========
            const genDate = new Date().toLocaleString();
            const ipStr = data.ipAddress ? ` | IP: ${data.ipAddress}` : "";

            doc.fontSize(6)
                .font("Helvetica")
                .fillColor(colors.secondary)
                .text(
                    `Generated on: ${genDate} | System ID: QC26-${data.rollNumber}${ipStr}`,
                    margin,
                    790,
                    { width: contentWidth, align: "right", lineBreak: false },
                );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
