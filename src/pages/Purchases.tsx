import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon 
} from '@mui/icons-material';
import { supabase } from '../lib/supabase.ts';
import { 
  Purchase, 
  PurchaseInsert, 
  Supplier, 
  PurchaseItem,
  Product 
} from '../types/database';

interface PurchaseWithSupplier extends Purchase {
  suppliers?: Supplier;
  purchase_items?: (PurchaseItem & { products?: Product })[];
}

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseWithSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState<Partial<PurchaseInsert>>({
    purchase_number: '',
    supplier_id: '',
    total_amount: 0,
    status: 'pending',
    payment_status: 'unpaid',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_person,
            email,
            phone
          ),
          purchase_items (
            *,
            products (
              id,
              name,
              sku
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const generatePurchaseNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = Date.now().toString().slice(-4);
    return `PO-${year}${month}${day}-${time}`;
  };

  const handleSubmit = async () => {
    try {
      const purchaseData = {
        ...formData,
        purchase_number: formData.purchase_number || generatePurchaseNumber(),
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (editingPurchase) {
        const { error } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', editingPurchase.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('purchases')
          .insert(purchaseData);
        
        if (error) throw error;
      }

      await fetchPurchases();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving purchase:', error);
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      purchase_number: purchase.purchase_number,
      supplier_id: purchase.supplier_id,
      total_amount: purchase.total_amount,
      status: purchase.status,
      payment_status: purchase.payment_status,
      purchase_date: purchase.purchase_date.split('T')[0],
      notes: purchase.notes
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        const { error } = await supabase
          .from('purchases')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        await fetchPurchases();
      } catch (error) {
        console.error('Error deleting purchase:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPurchase(null);
    setFormData({
      purchase_number: '',
      supplier_id: '',
      total_amount: 0,
      status: 'pending',
      payment_status: 'unpaid',
      purchase_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'received': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'unpaid': return 'error';
      case 'partial': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Purchase Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New Purchase Order
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Purchase #</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {purchase.purchase_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {purchase.suppliers?.name || 'Unknown Supplier'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {purchase.suppliers?.contact_person}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(purchase.purchase_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    ₹{purchase.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={purchase.status} 
                      color={getStatusColor(purchase.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={purchase.payment_status} 
                      color={getPaymentStatusColor(purchase.payment_status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(purchase)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(purchase.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    {purchase.status === 'pending' && (
                      <Tooltip title="Mark as Received">
                        <IconButton size="small" color="success">
                          <ShippingIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPurchase ? 'Edit Purchase Order' : 'New Purchase Order'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Purchase Number"
                value={formData.purchase_number}
                onChange={(e) => setFormData({ ...formData, purchase_number: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={formData.supplier_id}
                  label="Supplier"
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Purchase Date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Total Amount"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="received">Received</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={formData.payment_status}
                  label="Payment Status"
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                >
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPurchase ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchases; 