import { openDB } from 'idb';

const DB_NAME = 'invoice-app-db';
const DB_VERSION = 2;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('recipients')) {
                db.createObjectStore('recipients', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('invoices')) {
                const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
                invoiceStore.createIndex('date', 'date');
            }
            if (!db.objectStoreNames.contains('signers')) {
                db.createObjectStore('signers', { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

// Recipients
export const getRecipients = async () => {
    const db = await initDB();
    return db.getAll('recipients');
};

export const addRecipient = async (recipient) => {
    const db = await initDB();
    return db.add('recipients', recipient);
};

export const updateRecipient = async (recipient) => {
    const db = await initDB();
    return db.put('recipients', recipient);
};

export const deleteRecipient = async (id) => {
    const db = await initDB();
    return db.delete('recipients', id);
};

// Signers
export const getSigners = async () => {
    const db = await initDB();
    return db.getAll('signers');
};

export const addSigner = async (signer) => {
    const db = await initDB();
    return db.add('signers', signer);
};

export const deleteSigner = async (id) => {
    const db = await initDB();
    return db.delete('signers', id);
};

// Invoices (History)
export const getInvoices = async () => {
    const db = await initDB();
    return db.getAllFromIndex('invoices', 'date'); // Sort by date implicitly if needed, or just getAll
};

export const saveInvoice = async (invoice) => {
    const db = await initDB();
    // Ensure we don't duplicate if we are editing an existing history item, 
    // but usually invoices are snapshots. Let's assume a new save is a new entry or updates if ID exists.
    return db.put('invoices', { ...invoice, savedAt: new Date() });
};

export const deleteInvoice = async (id) => {
    const db = await initDB();
    return db.delete('invoices', id);
}
