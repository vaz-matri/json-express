import { resolve } from 'path';
import { createJiti } from 'jiti';

export async function runMigrate(cwd: string) {
    console.log('Starting migration...');
    const bootFile = resolve(cwd, 'src/boot.ts');
    
    try {
        // Load the user's boot file to initialize the Kernel
        const jiti = createJiti(import.meta.url, { interopDefault: true });
        const bootMod = await jiti.import(bootFile) as any;
        
        const kernel = bootMod.kernel || bootMod.default;
        
        if (!kernel) {
            console.error('Error: Could not find `kernel` exported from src/boot.ts');
            process.exit(1);
        }

        // We assume the kernel has a registered database adapter
        const db = (kernel as any).db;
        if (!db) {
            console.error('Error: No database adapter registered with the kernel.');
            process.exit(1);
        }

        if (typeof db.migrate === 'function') {
            await db.migrate();
            console.log('Migration completed successfully.');
        } else {
            console.log('The active database adapter does not require migration (no migrate method found).');
        }
        
        process.exit(0);
    } catch (error: any) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}
