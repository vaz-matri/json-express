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

        // Test 4: Operator-injection resistance (NoSQL injection).
        // A nested operator value like `{ $ne: ... }` must NEVER be honored as a query
        // operator — doing so lets a client exfiltrate rows a plain equality filter would
        // never match. With test1 and test2 present, an honored `$ne: test1` would return
        // exactly the OTHER row (non-empty, test1 excluded). A safe adapter instead either
        // strips the operator (→ matches all, test1 included) or treats it as a literal
        // value (→ matches none). So a non-empty result that excludes test1 is the tell.
        const injected = await db.search(
            'compliance_users',
            { email: { $ne: 'test1@example.com' } } as any
        );
        assert(
            injected.length === 0 || injected.some((r: any) => r.email === 'test1@example.com'),
            'Adapter MUST NOT honor operator objects ($ne/$gt/$where) in search filters — NoSQL injection risk. Route client filters through sanitizeFilter.'
        );

        console.log('✅ Adapter passed all compliance tests!');
    } finally {
        if (teardownAdapter && db!) {
            await teardownAdapter(db);
        }
    }
}
