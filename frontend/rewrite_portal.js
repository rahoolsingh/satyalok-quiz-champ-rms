const fs = require('fs');

let code = fs.readFileSync('src/pages/PublicPortal.tsx', 'utf8');

// 1. Add new lucide-react imports
code = code.replace(
  /import { ChevronDown, HelpCircle } from "lucide-react";/,
  `import { ChevronDown, HelpCircle, MapPin, Calendar, Clock, Award } from "lucide-react";`
);

// 2. Remove the old "Awaiting Result will be available as per fb" from important dates
code = code.replace(
  /\{isEventCompleted && \(\s*<span className="text-xs text-blue-600 font-medium block mt-1">\s*Awaiting Result will be available as per fb \(tentative\) all in IST\s*<\/span>\s*\)\}/g,
  ''
);

// 3. Define renderHeader
const headerCode = `
    const renderHeader = () => (
        <header className="mb-10 text-center space-y-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary rounded-full">
                    Quiz Champ 2026
                </span>
                <h1 className="text-4xl font-extrabold tracking-tight mt-3">Knowledge Championship</h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    The ultimate platform for students to test their mettle.
                </p>
            </motion.div>
        </header>
    );

    const renderDateCard = (icon: React.ReactNode, label: string, value: string) => (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <div className="p-2 bg-background rounded-lg border text-primary">{icon}</div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
            </div>
        </div>
    );
`;

code = code.replace(
    /const isEventCompleted = useMemo\(\(\) => \{/,
    headerCode + '\n    const isEventCompleted = useMemo(() => {'
);

// 4. Replace the old importantDatesSection with the new one
const newImportantDates = `
    const importantDatesSection = (
        <div className="mb-8 space-y-3">
            <h3 className="text-sm uppercase tracking-wide text-muted-foreground font-semibold mb-4">Important Dates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderDateCard(
                    <Calendar className="w-5 h-5" />, 
                    "Last Date to Apply", 
                    status.closingDate ? \`\${new Date(status.closingDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })} \${new Date(status.closingDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST\` : 'Not Declared'
                )}
                {!isEventCompleted && renderDateCard(
                    <Clock className="w-5 h-5" />, 
                    "Date of Examination", 
                    status.eventDate ? \`\${new Date(status.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })}\` : 'Not Declared'
                )}
                {!isEventCompleted && renderDateCard(
                    <MapPin className="w-5 h-5" />, 
                    "Reporting Time", 
                    status.reportingTime ? \`\${status.reportingTime} IST\` : 'Not Declared'
                )}
                {!isEventCompleted && renderDateCard(
                    <Clock className="w-5 h-5" />, 
                    "Exam Time", 
                    status.examTime ? \`\${status.examTime} IST\` : 'Not Declared'
                )}
                {renderDateCard(
                    <Award className="w-5 h-5" />, 
                    "Prize Distribution", 
                    status.prizeDistributionDate ? \`\${new Date(status.prizeDistributionDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })}\${status.prizeDistributionTime ? \` \${status.prizeDistributionTime} IST\` : ''}\` : 'Not Declared'
                )}
                {renderDateCard(
                    <Award className="w-5 h-5" />, 
                    "Result Announcement", 
                    status.resultPublicationDate ? \`\${new Date(status.resultPublicationDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })} \${new Date(status.resultPublicationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST\` : 'Not Declared'
                )}
            </div>
        </div>
    );
`;

code = code.replace(/const importantDatesSection = \([\s\S]*?\n    \);/m, newImportantDates.trim());


fs.writeFileSync('src/pages/PublicPortal.tsx', code);
