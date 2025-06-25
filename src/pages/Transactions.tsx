import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase.ts';

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  main_category?: { name: string };
  subcategory?: { name: string };
}

interface SaleItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

interface Sale {
  id: string;
  sale_number: string;
  customer_name?: string;
  customer_contact?: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
  sale_date: string;
  created_at: string;
  sale_items?: SaleItem[];
}

const Transactions: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_contact: '',
    payment_method: 'cash',
    notes: '',
  });

  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products with stock info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          main_category:main_categories(name),
          subcategory:subcategories(name)
        `)
        .gt('quantity', 0)
        .order('name');

      if (productsError) throw productsError;

      // Fetch sales with sale items
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            product:products(name, sku)
          )
        `)
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;

      setProducts(productsData || []);
      setSales(salesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAlert({ type: 'error', message: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      setAlert({ type: 'error', message: 'Please add items to the cart' });
      return;
    }

    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);

      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          customer_name: formData.customer_name || null,
          customer_contact: formData.customer_contact || null,
          total_amount: totalAmount,
          payment_method: formData.payment_method,
          payment_status: 'completed',
          notes: formData.notes || null
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cartItems.map(item => ({
        sale_id: saleData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      setAlert({ type: 'success', message: `Sale ${saleData.sale_number} created successfully` });
      fetchData();
      handleClose();
    } catch (error) {
      console.error('Error creating sale:', error);
      setAlert({ type: 'error', message: 'Failed to create sale' });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      customer_name: '',
      customer_contact: '',
      payment_method: 'cash',
      notes: '',
    });
    setCartItems([]);
    setSelectedProduct(null);
    setItemQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      setAlert({ type: 'error', message: 'Please select a product' });
      return;
    }

    if (itemQuantity <= 0 || itemQuantity > selectedProduct.quantity) {
      setAlert({ type: 'error', message: 'Invalid quantity' });
      return;
    }

    const existingItemIndex = cartItems.findIndex(item => item.product_id === selectedProduct.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + itemQuantity;
      
      if (newQuantity > selectedProduct.quantity) {
        setAlert({ type: 'error', message: 'Total quantity exceeds available stock' });
        return;
      }

      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex].total_price = newQuantity * selectedProduct.unit_price;
      setCartItems(updatedItems);
    } else {
      const newItem: SaleItem = {
        product_id: selectedProduct.id,
        quantity: itemQuantity,
        unit_price: selectedProduct.unit_price,
        total_price: itemQuantity * selectedProduct.unit_price,
        product: selectedProduct
      };
      setCartItems([...cartItems, newItem]);
    }

    setSelectedProduct(null);
    setItemQuantity(1);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setViewDialogOpen(true);
  };

  const getTotalAmount = () => {
    return cartItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading transactions...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sales Transactions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          New Sale
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            Recent Sales
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sale #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {sale.sale_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {sale.customer_name || 'Walk-in Customer'}
                      </Typography>
                      {sale.customer_contact && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {sale.customer_contact}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${sale.sale_items?.length || 0} items`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        ${sale.total_amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sale.payment_method}
                        size="small"
                        color={sale.payment_status === 'completed' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleViewSale(sale)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No sales found. Create your first sale to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          Create New Sale
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Customer Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name (Optional)"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Contact (Optional)"
                value={formData.customer_contact}
                onChange={(e) => setFormData({ ...formData, customer_contact: e.target.value })}
              />
            </Grid>

            {/* Add Items to Cart */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon />
                Add Items
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                value={selectedProduct}
                onChange={(event, newValue) => setSelectedProduct(newValue)}
                options={products}
                getOptionLabel={(option) => `${option.name} (${option.sku}) - Stock: ${option.quantity}`}
                groupBy={(option) => option.main_category?.name || 'Uncategorized'}
                renderInput={(params) => (
                  <TextField {...params} label="Select Product" fullWidth />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        SKU: {option.sku} | Stock: {option.quantity} | Price: ${option.unit_price}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
                inputProps={{ min: 1, max: selectedProduct?.quantity || 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddToCart}
                disabled={!selectedProduct}
                sx={{ height: 56 }}
              >
                Add to Cart
              </Button>
            </Grid>

            {/* Cart Items */}
            {cartItems.length > 0 && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>Cart Items</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <List>
                    {cartItems.map((item) => (
                      <ListItem key={item.product_id} divider>
                        <ListItemText
                          primary={item.product?.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                Quantity: {item.quantity} × ${item.unit_price} = ${item.total_price.toFixed(2)}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveFromCart(item.product_id)}
                            color="error"
                          >
                            <RemoveIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="h6" align="right">
                      Total: ${getTotalAmount().toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}

            {/* Payment Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>Payment Information</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.payment_method}
                  label="Payment Method"
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="credit">Credit</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={cartItems.length === 0}
          >
            Complete Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Sale Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Sale Details - {selectedSale?.sale_number}
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                <Typography variant="body1">
                  {selectedSale.customer_name || 'Walk-in Customer'}
                </Typography>
                {selectedSale.customer_contact && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedSale.customer_contact}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Sale Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedSale.sale_date).toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                <Typography variant="body1">{selectedSale.payment_method}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                <Chip 
                  label={selectedSale.payment_status}
                  color={selectedSale.payment_status === 'completed' ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>

              {selectedSale.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body1">{selectedSale.notes}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>Sale Items</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSale.sale_items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product?.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>${item.total_price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                          Total Amount:
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          ${selectedSale.total_amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions; 