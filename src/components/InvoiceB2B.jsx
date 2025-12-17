import { useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { getRecipients, addRecipient, updateRecipient, saveInvoice, getSigners, addSigner, deleteSigner } from '../db'
import InvoiceHistory from './InvoiceHistory'
import '../EditorPanel.css'
import '../Invoice.css'

function InvoiceB2B() {
    const [data, setData] = useState({
        sender: {
            name: "PT. TALENTA EDUKASI SEKUMPUL",
            address: "Jalan TB Simatupang No 5\nAD Premiere LT 17 Suite 04 B Jakarta Selatan - 12550\nIndonesia",
        },
        invoiceNumber: "031/XII/IODA/2025",
        date: "2025-12-17",
        dueDate: "2025-12-27",
        recipient: {
            name: "Yayasan Plan International Indonesia",
            address: "Komplek Buncit Utama Kav. 16, Jl. Warung Jati Barat RT 001/RW 005\nKelurahan Jati Padang, Kecamatan Pasar Minggu, Jakarta Selatan\n12540,"
        },
        items: [
            {
                id: 1,
                date: "2025-12-17",
                description: "Termin 3 - Rekrutmen dan Training\nPeserta AVPN (1200 Peserta)",
                price: 28200000,
                qty: 1
            }
        ],
        taxRate: 0.005, // 0.5% based on 141.000 / 28.200.000
        bank: {
            accountName: "PT TALENTA EDUKASI SEKUMPUL",
            bankName: "BCA (KCU ALAM SUTERA)",
            accountNumber: "6044429173"
        },
        signer: "Haidi Muhammad Rizki",
        contact: {
            email: "partnership@iodalearning.com",
            phone: "0895415079721"
        },
        signatureImage: null
    })

    // App State
    const [view, setView] = useState('editor') // 'editor' | 'history'
    const [savedRecipients, setSavedRecipients] = useState([])
    const [isNewRecipient, setIsNewRecipient] = useState(false)
    const [editingRecipientId, setEditingRecipientId] = useState(null) // If editing an existing DB recipient
    const [savedSigners, setSavedSigners] = useState([])
    const [currentTheme, setCurrentTheme] = useState('default') // 'default' | 'simple-1' | 'simple-2'
    const [themeColors, setThemeColors] = useState({
        primary: '#5e2a84', // Default Purple
        secondary: '#ff6b00', // Default Orange
    })

    // Notification State
    const [notification, setNotification] = useState(null)

    const showNotification = (message) => {
        setNotification(message)
        setTimeout(() => setNotification(null), 5000)
    }

    // Load Data on Mount
    useEffect(() => {
        loadRecipients()
        loadSigners()
    }, [])

    const loadRecipients = async () => {
        const recs = await getRecipients()
        setSavedRecipients(recs)
    }

    const loadSigners = async () => {
        const s = await getSigners()
        setSavedSigners(s)
    }

    // Calculations
    const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.qty), 0)
    const tax = subtotal * data.taxRate
    const grandTotal = subtotal - tax // Wait, reference shows: Total 28.200.000, Pph Final 141.000, Grand Total 28.059.000. So it's Subtotal - Tax.

    // Handlers
    const handleNestedChange = (section, field, value) => {
        setData({ ...data, [section]: { ...data[section], [field]: value } })
    }


    const handleItemChange = (index, field, value) => {
        const newItems = [...data.items]
        newItems[index][field] = value
        setData({ ...data, items: newItems })
    }

    const addItem = () => {
        setData({ ...data, items: [...data.items, { id: Date.now(), date: "", description: "", price: 0, qty: 1 }] })
    }

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index)
        setData({ ...data, items: newItems })
    }

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setData(prev => ({ ...prev, signatureImage: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSavedRecipientChange = (e) => {
        const val = e.target.value
        if (val === "new") {
            setIsNewRecipient(true)
            setEditingRecipientId(null)
            setData(prev => ({ ...prev, recipient: { name: "", address: "" } }))
        } else {
            setIsNewRecipient(false)
            const recipient = savedRecipients.find(r => r.id === parseInt(val))
            if (recipient) {
                setEditingRecipientId(recipient.id)
                setData(prev => ({ ...prev, recipient: { name: recipient.name, address: recipient.address } }))
            }
        }
    }

    const saveRecipientToDB = async () => {
        if (!data.recipient.name) return showNotification("Recipient name is required")

        if (isNewRecipient) {
            await addRecipient(data.recipient)
            showNotification("Recipient Saved Successfully!")
            setIsNewRecipient(false)
        } else if (editingRecipientId) {
            // Update existing
            await updateRecipient({ ...data.recipient, id: editingRecipientId })
            showNotification("Recipient Updated Successfully!")
        }
        loadRecipients()
    }

    const handleSavedSignerChange = (e) => {
        const val = e.target.value
        if (val === "new") {
            setData(prev => ({ ...prev, signer: "", signatureImage: null }))
        } else {
            const signer = savedSigners.find(s => s.id === parseInt(val))
            if (signer) {
                setData(prev => ({ ...prev, signer: signer.name, signatureImage: signer.image }))
            }
        }
    }

    const saveSignerToDB = async () => {
        if (!data.signer) return showNotification("Signer name is required")
        await addSigner({ name: data.signer, image: data.signatureImage })
        showNotification("Signer Saved Successfully!")
        loadSigners()
    }



    const handleSaveAndPrint = async () => {
        // 1. Save to History
        await saveInvoice(data)
        // 2. Print
        window.print()
    }

    const loadInvoiceFromHistory = (invoice) => {
        setData(invoice)
        setView('editor')
    }

    // Formatting
    const formatIDR = (num) => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num)
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ""
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    if (view === 'history') {
        return <InvoiceHistory onLoadInvoice={loadInvoiceFromHistory} onBack={() => setView('editor')} />
    }

    return (
        <div className="app-layout">
            {/* Editor Panel - Hidden on Print */}
            <div className="editor-panel no-print">
                {notification && (
                    <div className="notification-toast" style={{
                        position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#333', color: 'white', padding: '10px 20px', borderRadius: '5px', zIndex: 1000
                    }}>
                        {notification}
                    </div>
                )}
                <div className="editor-header">
                    <h2>Invoice Settings</h2>
                    <button onClick={() => setView('history')} className="btn-history">
                        <span>History</span>
                    </button>
                </div>

                <div className="form-group">
                    <label>Theme</label>
                    <select value={currentTheme} onChange={e => setCurrentTheme(e.target.value)}>
                        <option value="default">Default (Colorful)</option>
                        <option value="simple-1">Simple Elegant 1 (Minimal)</option>
                        <option value="simple-2">Simple Elegant 2 (Modern)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Theme Colors</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '10px' }}>Primary</label>
                            <input
                                type="color"
                                value={themeColors.primary}
                                onChange={e => setThemeColors({ ...themeColors, primary: e.target.value })}
                                style={{ width: '100%', height: '30px', padding: 0, border: 'none' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '10px' }}>Secondary</label>
                            <input
                                type="color"
                                value={themeColors.secondary}
                                onChange={e => setThemeColors({ ...themeColors, secondary: e.target.value })}
                                style={{ width: '100%', height: '30px', padding: 0, border: 'none' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>Invoice No</label>
                    <input value={data.invoiceNumber} onChange={e => setData({ ...data, invoiceNumber: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" value={data.dueDate} onChange={e => setData({ ...data, dueDate: e.target.value })} />
                </div>

                <h3>Recipient</h3>

                <div className="form-group">
                    <label>Select Saved Recipient</label>
                    <select onChange={handleSavedRecipientChange} value={isNewRecipient ? "new" : (editingRecipientId || "")}>
                        <option value="" disabled>-- Select --</option>
                        {savedRecipients.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                        <option value="new">+ Create New Recipient</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Name</label>
                    <input value={data.recipient.name} onChange={e => handleNestedChange('recipient', 'name', e.target.value)} disabled={!isNewRecipient && !editingRecipientId} />
                </div>
                <div className="form-group">
                    <label>Address</label>
                    <textarea value={data.recipient.address} onChange={e => handleNestedChange('recipient', 'address', e.target.value)} rows={4} disabled={!isNewRecipient && !editingRecipientId} />
                </div>

                {(isNewRecipient || editingRecipientId) && (
                    <button onClick={saveRecipientToDB} className="btn-save" style={{ marginBottom: '20px', width: '100%' }}>
                        {isNewRecipient ? "Save New Recipient" : "Update Saved Recipient"}
                    </button>
                )}

                <h3>Items</h3>
                {data.items.map((item, index) => (
                    <div key={item.id} className="item-editor">
                        <input type="date" value={item.date} onChange={e => handleItemChange(index, 'date', e.target.value)} />
                        <textarea placeholder="Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                        <div className="item-row">
                            <input type="number" placeholder="Price" value={item.price} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))} />
                            <input type="number" placeholder="Qty" value={item.qty} onChange={e => handleItemChange(index, 'qty', parseInt(e.target.value))} />
                        </div>
                        <button onClick={() => removeItem(index)} className="btn-remove">Remove</button>
                    </div>
                ))}
                <button onClick={addItem} className="btn-add">Add Item</button>

                <div className="form-group">
                    <label>Pph Rate (%)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={data.taxRate * 100}
                        onChange={e => setData({ ...data, taxRate: parseFloat(e.target.value) / 100 })}
                    />
                </div>

                <h3>Sender (Header)</h3>
                <div className="form-group">
                    <label>Company Name</label>
                    <input value={data.sender.name} onChange={e => handleNestedChange('sender', 'name', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Address</label>
                    <textarea value={data.sender.address} onChange={e => handleNestedChange('sender', 'address', e.target.value)} rows={3} />
                </div>

                <h3>Bank Details</h3>
                <div className="form-group">
                    <label>Account Name</label>
                    <input value={data.bank.accountName} onChange={e => handleNestedChange('bank', 'accountName', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Bank Name</label>
                    <input value={data.bank.bankName} onChange={e => handleNestedChange('bank', 'bankName', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Account Number</label>
                    <input value={data.bank.accountNumber} onChange={e => handleNestedChange('bank', 'accountNumber', e.target.value)} />
                </div>

                <h3>Signer & Contact</h3>

                <div className="form-group">
                    <label>Select Saved Signer</label>
                    <select onChange={handleSavedSignerChange} defaultValue="">
                        <option value="" disabled>-- Select --</option>
                        {savedSigners.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        <option value="new">+ New Signer</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Signer Name</label>
                    <input value={data.signer} onChange={e => setData({ ...data, signer: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Signature/Stamp Image (Optional)</label>
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} />
                    {data.signatureImage && (
                        <div style={{ marginTop: '5px' }}>
                            <img src={data.signatureImage} alt="Preview" style={{ height: '30px', verticalAlign: 'middle', marginRight: '10px' }} />
                            <button onClick={() => setData({ ...data, signatureImage: null })} style={{ fontSize: '12px', padding: '2px 5px' }}>Remove</button>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                    <button onClick={saveSignerToDB} className="btn-save" style={{ flex: 1, marginBottom: 0 }}>
                        Save Current Signer
                    </button>
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input value={data.contact.email} onChange={e => handleNestedChange('contact', 'email', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Phone</label>
                    <input value={data.contact.phone} onChange={e => handleNestedChange('contact', 'phone', e.target.value)} />
                </div>

                <div className="print-controls" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleSaveAndPrint} className="btn-print" style={{ flex: 1 }}>
                        Print / Download PDF
                    </button>
                    <button onClick={async () => {
                        const element = document.querySelector('.invoice-container')
                        if (element) {
                            const canvas = await html2canvas(element, { scale: 2 })
                            const link = document.createElement('a')
                            link.download = `Invoice-${data.invoiceNumber}.png`
                            link.href = canvas.toDataURL()
                            link.click()
                        }
                    }} className="btn-print" style={{ flex: 1, backgroundColor: '#ff6b00' }}>
                        Download PNG
                    </button>
                </div>
            </div>

            {/* Invoice Preview */}
            <div className="invoice-preview">
                <div
                    className={`invoice-container theme-${currentTheme}`}
                    style={{
                        '--primary-purple': themeColors.primary,
                        '--primary-blue': themeColors.secondary, /* Map to secondary for flexible styling */
                        '--accent-orange': themeColors.secondary,
                        '--text-dark': '#1a1a1a'
                    }}
                >

                    {/* Header */}
                    <div className="header">
                        <div className="header-bg-purple">
                            <div className="header-title">{data.sender.name}</div>
                            <div className="header-address">
                                {data.sender.address.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                            </div>
                        </div>

                        <div className="header-bg-yellow"></div>

                        <div className="header-bg-blue">
                            <div className="invoice-label">INVOICE</div>
                        </div>
                    </div>

                    <div className="content">
                        <div className="recipient-section">
                            <div className="recipient-label">Kepada :</div>
                            <div className="recipient-name">{data.recipient.name}</div>
                            <div className="recipient-address">
                                {data.recipient.address.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                            </div>
                        </div>

                        <div className="invoice-meta">
                            <div className="meta-title">Detail Invoice</div>
                            <div className="meta-grid">
                                <div className="meta-label">No. Invoice</div>
                                <div className="meta-value">: {data.invoiceNumber}</div>
                                <div className="meta-label">Date</div>
                                <div className="meta-value">: {formatDate(data.date)}</div>
                                <div className="meta-label">Due Date</div>
                                <div className="meta-value">: {formatDate(data.dueDate)}</div>
                            </div>
                        </div>

                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th className="col-date">Date</th>
                                    <th className="col-desc">Description</th>
                                    <th className="col-price">Unit Price</th>
                                    <th className="col-qty">Qty</th>
                                    <th className="col-amount">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item, i) => (
                                    <tr key={i}>
                                        <td>{formatDate(item.date)}</td>
                                        <td style={{ whiteSpace: 'pre-line' }}>{item.description}</td>
                                        <td>
                                            <div className="price-row">
                                                <span>Rp</span>
                                                <span>{formatIDR(item.price)}</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{item.qty}</td>
                                        <td>
                                            <div className="price-row">
                                                <span>Rp</span>
                                                <span>{formatIDR(item.price * item.qty)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="totals-section">
                            <div className="total-row">
                                <span className="total-label">Total</span>
                                <span className="total-currency">Rp</span>
                                <span className="total-value">{formatIDR(subtotal)}</span>
                            </div>
                            <div className="total-row">
                                <span className="total-label">Pph Final ({data.taxRate * 100}%)</span>
                                <span className="total-currency">Rp</span>
                                <span className="total-value">{formatIDR(tax)}</span>
                            </div>
                            <div className="total-row">
                                <span className="total-label">Grand Total</span>
                                <span className="total-currency">Rp</span>
                                <span className="total-value">{formatIDR(grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="footer-section">
                        <div className="terms-box">
                            <div className="terms-title">Terms & Conditions :</div>
                            <div className="terms-content">
                                <strong>Seluruh Pembayaran Dikirimkan Ke</strong>
                                <div className="bank-details" style={{ marginTop: '5px' }}>
                                    <strong>NAMA REKENING</strong>
                                    <span>: {data.bank.accountName}</span>
                                    <strong>BANK</strong>
                                    <span>: {data.bank.bankName}</span>
                                    <strong>NOMOR</strong>
                                    <span>: {data.bank.accountNumber}</span>
                                </div>
                            </div>
                        </div>

                        <div className="signature-section">
                            <div className="stamp-placeholder">
                                {data.signatureImage ? (
                                    <img src={data.signatureImage} alt="Signature" style={{ height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    /* Circle placeholder for stamp */
                                    <div style={{
                                        width: '80px', height: '80px',
                                        border: '2px solid purple', borderRadius: '50%',
                                        position: 'absolute', left: '50%', top: '0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'purple', fontSize: '10px', transform: 'translate(-50%, 0) rotate(-15deg)', opacity: 0.5
                                    }}>
                                        STAMP
                                    </div>
                                )}
                            </div>
                            <div className="signer-name">{data.signer}</div>
                        </div>
                    </div>

                    <div className="bottom-bar">
                        <div className="contact-row">
                            📧 {data.contact.email}
                        </div>
                        <div className="contact-row">
                            ☎ {data.contact.phone}
                        </div>
                    </div>

                </div>
            </div>

            {/* Styles removed in favor of CSS files */}
        </div>
    )
}

export default InvoiceB2B
