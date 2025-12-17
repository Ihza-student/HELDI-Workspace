import { useState, useEffect } from 'react';
import { getInvoices, deleteInvoice } from '../db';
import './InvoiceHistory.css'; // We'll create this

export default function InvoiceHistory({ onLoadInvoice, onBack }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getInvoices();
        // Sort by date descending
        data.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        setInvoices(data);
        setLoading(false);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this invoice from history?')) {
            await deleteInvoice(id);
            loadHistory();
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    return (
        <div className="history-container">
            <div className="history-header">
                <h2>Invoice History</h2>
                <button onClick={onBack} className="btn-back">Back to Editor</button>
            </div>

            {loading ? (
                <p>Loading history...</p>
            ) : invoices.length === 0 ? (
                <div className="empty-state">
                    <p>No invoices saved yet.</p>
                    <button onClick={onBack}>Create your first invoice</button>
                </div>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Inv No.</th>
                            <th>Recipient</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => {
                            // Calculate total safe
                            const sub = inv.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
                            const tax = sub * (inv.taxRate || 0);
                            const total = sub - tax;

                            return (
                                <tr key={inv.id} onClick={() => onLoadInvoice(inv)} className="history-row">
                                    <td>{new Date(inv.date).toLocaleDateString()}</td>
                                    <td>{inv.invoiceNumber}</td>
                                    <td>{inv.recipient.name}</td>
                                    <td>{formatCurrency(total)}</td>
                                    <td>
                                        <button className="btn-delete-history" onClick={(e) => handleDelete(inv.id, e)}>Delete</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
