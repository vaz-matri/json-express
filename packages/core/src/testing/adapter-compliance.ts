import { IDatabaseAdapter, defineModel, types, UniqueConstraintError, ModelSchema } from '../index';
import assert from 'assert';

export async function runAdapterComplianceTests(
    setupAdapter: () => Promise<IDatabaseAdapter> | IDatabaseAdapter,
    teardownAdapter?: (adapter: IDatabaseAdapter) => Promise<void> | void
) {
    let db: IDatabaseAdapter;

    const testSchemas: ModelSchema[] = [
        defineModel({
            name: 'compliance_users',
            fields: {
                id: types.id(),
                email: types.string({ unique: true }),
                username: types.string()
            }
        })
    ];

    try {
        console.log('--- Running Adapter Compliance Tests ---');
        db = await setupAdapter();
        if (db.setSchemas) {
            db.setSchemas(testSchemas);
        }

        // Test 1: Basic Create and Get
        const user1 = await db.create('compliance_users', { email: 'test1@example.com', username: 'test1' });
        assert(user1.id, 'Adapter must generate and return an ID on create');
        
        const fetched = await db.getById('compliance_users', user1.id);
        assert(fetched.email === 'test1@example.com', 'Adapter must return the correct record by ID');

        // Test 2: Unique Constraint Enforcement
        let threwUniqueError = false;
        try {
            await db.create('compliance_users', { email: 'test1@example.com', username: 'duplicate' });
        } catch (e: any) {
            if (e instanceof UniqueConstraintError) {
                threwUniqueError = true;
            } else if (e.name === 'UniqueConstraintError') {
                threwUniqueError = true;
            } else {
                console.error('Expected UniqueConstraintError, but got:', e);
            }
        }
        assert(threwUniqueError, 'Adapter MUST throw UniqueConstraintError when creating a record that violates a unique constraint');

        // Test 3: Unique Constraint on Update
        const user2 = await db.create('compliance_users', { email: 'test2@example.com', username: 'test2' });
        let updateThrewUniqueError = false;
        try {
            await db.update('compliance_users', user2.id, { email: 'test1@example.com' });
        } catch (e: any) {
             if (e instanceof UniqueConstraintError || e.name === 'UniqueConstraintError') {
                 updateThrewUniqueError = true;
             }
        }
        assert(updateThrewUniqueError, 'Adapter MUST throw UniqueConstraintError when updating a record to violate a unique constraint');

        console.log('✅ Adapter passed all compliance tests!');
    } finally {
        if (teardownAdapter && db!) {
            await teardownAdapter(db);
        }
    }
}
