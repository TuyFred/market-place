import fs from 'fs';
import path from 'path';

const filesToFix = [
    'frontend/src/components/layout/Navbar.tsx',
    'frontend/src/components/products/ProductCard.tsx',
    'frontend/src/pages/AdminDashboardPage.tsx'
];

for (const relPath of filesToFix) {
    const filePath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping missing file: ${filePath}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to match the git conflict markers.
    // We want to KEEP the HEAD section (the current good code we've been working on) 
    // and discard the merged section (the old code).
    // Pattern:
    // <<<<<<< HEAD\n
    // (HEAD content)
    // =======\n
    // (merged content)
    // >>>>>>> (commit msg)\n

    const conflictRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [^\r\n]*\r?\n/g;

    const initialLength = content.length;
    content = content.replace(conflictRegex, '$1');

    if (content.length !== initialLength) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed conflicts in: ${relPath}`);
    } else {
        console.log(`No conflicts found in: ${relPath} (or exact match failed)`);
    }
}

// Ensure no other files have conflicts
import { execSync } from 'child_process';
try {
    // We'll also just aggressively search for <<<<<<< HEAD incase we missed any file
    console.log("Checking for any remaining conflicts...");
    const output = execSync('grep -rl "<<<<<<< HEAD" . || true', { encoding: 'utf8' });
    if (output.trim()) {
        console.log("Found remaining conflicts in:\n" + output);
    } else {
        console.log("All conflicts resolved cleanly.");
    }
} catch (e) {
    // ignore
}
