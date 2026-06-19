const fs = require('fs');

let content = fs.readFileSync('src/app/admin/spin-wheel/page.tsx', 'utf-8');

// 1. Fix profile relation
content = content.replace(/players\(id,full_name,level\)/g, "profile(id,fullname,level)");
content = content.replace(/p\.players\?\.id/g, "p.profile?.id");
content = content.replace(/p\.players\?\.full_name/g, "p.profile?.fullname");
content = content.replace(/p\.players\?\.level/g, "p.profile?.level");
content = content.replace(/p\.players\.id/g, "p.profile?.id || ''");
content = content.replace(/p\.players\.full_name/g, "p.profile?.fullname || ''");
content = content.replace(/p\.players\.level/g, "p.profile?.level || null");

// 2. Fix updated_at removal
content = content.replace(/updated_at:\s*new\s*Date\(\)\.toISOString\(\),?/g, "");

// 3. Remove assignGroups import
content = content.replace(/generateScheduleFromSpin, assignGroups/, "generateScheduleFromSpin");

// 4. Remove previewGroups calculation (replace with empty array)
content = content.replace(
  /const previewGroups = session\?\.pairs\?\.length && session\.pairs\.length > 4[\s\S]*?: \[\];/,
  "const previewGroups: any[] = [];"
);

// 5. Replace previewGroups JSX block
const jsxStart = "{previewGroups.length > 0 ? (";
const jsxEnd = "</div>\n          )}";
const blockRegex = new RegExp(jsxStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + jsxEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

content = content.replace(blockRegex, `
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-center">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-2">Mode Pertandingan: {isDirectKnockout ? 'Sistem Gugur Langsung' : 'Sistem Gugur'}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Karena jumlah tim {session?.pairs?.length || 0}, pertandingan akan langsung menggunakan sistem gugur.</p>
            </div>
`);

fs.writeFileSync('src/app/admin/spin-wheel/page.tsx', content);
