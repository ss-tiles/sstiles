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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase.ts';

interface MainCategory {
  id: string;
  name: string;
  description?: string;
}

interface AttributeSchema {
  required_fields: string[];
  field_types: Record<string, string>;
}

interface Subcategory {
  id: string;
  main_category_id: string;
  name: string;
  description?: string;
  attribute_schema: AttributeSchema;
  main_category?: MainCategory;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  main_category_id: string;
  subcategory_id: string;
  attributes: Record<string, any>;
  quantity: number;
  unit_price: number;
  reorder_level: number;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  main_category?: MainCategory;
  subcategory?: Subcategory;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    main_category_id: '',
    subcategory_id: '',
    attributes: {} as Record<string, any>,
    quantity: 0,
    unit_price: 0,
    reorder_level: 10,
    supplier: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch main categories
      const { data: mainCatsData, error: mainCatsError } = await supabase
        .from('main_categories')
        .select('*')
        .order('name');

      if (mainCatsError) throw mainCatsError;

      // Fetch subcategories with main category info
      const { data: subcatsData, error: subcatsError } = await supabase
        .from('subcategories')
        .select(`
          *,
          main_category:main_categories(*)
        `)
        .order('name');

      if (subcatsError) throw subcatsError;

      // Fetch products with related data
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          main_category:main_categories(*),
          subcategory:subcategories(*)
        `)
        .order('name');

      if (productsError) throw productsError;

      setMainCategories(mainCatsData || []);
      setSubcategories(subcatsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAlert({ type: 'error', message: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            sku: formData.sku,
            main_category_id: formData.main_category_id,
            subcategory_id: formData.subcategory_id,
            attributes: formData.attributes,
            quantity: formData.quantity,
            unit_price: formData.unit_price,
            reorder_level: formData.reorder_level,
            supplier: formData.supplier,
            notes: formData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Product updated successfully' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            sku: formData.sku,
            main_category_id: formData.main_category_id,
            subcategory_id: formData.subcategory_id,
            attributes: formData.attributes,
            quantity: formData.quantity,
            unit_price: formData.unit_price,
            reorder_level: formData.reorder_level,
            supplier: formData.supplier,
            notes: formData.notes
          }]);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Product created successfully' });
      }

      fetchData();
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setAlert({ type: 'error', message: 'Failed to save product' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Product deleted successfully' });
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
        setAlert({ type: 'error', message: 'Failed to delete product' });
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      main_category_id: product.main_category_id,
      subcategory_id: product.subcategory_id,
      attributes: product.attributes || {},
      quantity: product.quantity,
      unit_price: product.unit_price,
      reorder_level: product.reorder_level,
      supplier: product.supplier || '',
      notes: product.notes || '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      main_category_id: '',
      subcategory_id: '',
      attributes: {},
      quantity: 0,
      unit_price: 0,
      reorder_level: 10,
      supplier: '',
      notes: '',
    });
    setSelectedMainCategory('');
    setSelectedSubcategory('');
  };

  const handleMainCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, main_category_id: categoryId, subcategory_id: '', attributes: {} });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    const newAttributes: Record<string, any> = {};
    
    if (subcategory?.attribute_schema?.required_fields) {
      subcategory.attribute_schema.required_fields.forEach(field => {
        newAttributes[field] = '';
      });
    }

    setFormData({ 
      ...formData, 
      subcategory_id: subcategoryId, 
      attributes: newAttributes 
    });
  };

  const handleAttributeChange = (attributeName: string, value: any) => {
    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [attributeName]: value
      }
    });
  };

  const getFilteredSubcategories = () => {
    return subcategories.filter(sub => sub.main_category_id === formData.main_category_id);
  };

  const getSelectedSubcategory = () => {
    return subcategories.find(sub => sub.id === formData.subcategory_id);
  };

  const renderAttributeField = (fieldName: string, fieldType: string) => {
    const value = formData.attributes[fieldName] || '';
    
    switch (fieldType) {
      case 'number':
        return (
          <TextField
            fullWidth
            label={fieldName}
            type="number"
            value={value}
            onChange={(e) => handleAttributeChange(fieldName, Number(e.target.value))}
            variant="outlined"
            size="small"
          />
        );
      case 'date':
        return (
          <TextField
            fullWidth
            label={fieldName}
            type="date"
            value={value}
            onChange={(e) => handleAttributeChange(fieldName, e.target.value)}
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        );
      case 'email':
        return (
          <TextField
            fullWidth
            label={fieldName}
            type="email"
            value={value}
            onChange={(e) => handleAttributeChange(fieldName, e.target.value)}
            variant="outlined"
            size="small"
          />
        );
      case 'url':
        return (
          <TextField
            fullWidth
            label={fieldName}
            type="url"
            value={value}
            onChange={(e) => handleAttributeChange(fieldName, e.target.value)}
            variant="outlined"
            size="small"
          />
        );
      default:
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={value}
            onChange={(e) => handleAttributeChange(fieldName, e.target.value)}
            variant="outlined"
            size="small"
          />
        );
    }
  };

  const renderProductAttributes = (attributes: Record<string, any>) => {
    return Object.entries(attributes || {}).map(([key, value]) => (
      <Chip 
        key={key} 
        label={`${key}: ${value}`} 
        size="small" 
        variant="outlined" 
        sx={{ m: 0.25 }}
      />
    ));
  };

  const getLowStockProducts = () => {
    return products.filter(product => product.quantity <= product.reorder_level);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading products...</Typography>
      </Box>
    );
  }

  const lowStockProducts = getLowStockProducts();

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

      {lowStockProducts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium">
            <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            {lowStockProducts.length} products are low in stock and need reordering.
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Products Inventory
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Product
        </Button>
      </Box>

      {/* Products by Category */}
      {mainCategories.map((mainCategory) => {
        const categoryProducts = products.filter(p => p.main_category_id === mainCategory.id);
        if (categoryProducts.length === 0) return null;

        return (
          <Card key={mainCategory.id} sx={{ mb: 3 }}>
            <CardContent>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon color="primary" />
                    {mainCategory.name} ({categoryProducts.length} products)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Subcategory</TableCell>
                          <TableCell>Attributes</TableCell>
                          <TableCell>Stock</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Supplier</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categoryProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {product.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {product.sku}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={product.subcategory?.name || 'Unknown'} 
                                size="small" 
                                variant="outlined" 
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ maxWidth: 200, overflow: 'hidden' }}>
                                {renderProductAttributes(product.attributes)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`${product.quantity} units`}
                                color={product.quantity <= product.reorder_level ? 'error' : 'success'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                ${product.unit_price.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {product.supplier || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(product)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(product.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        );
      })}

      {products.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No products found. Add your first product to get started.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Main Category</InputLabel>
                <Select
                  value={formData.main_category_id}
                  label="Main Category"
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                >
                  {mainCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!formData.main_category_id}>
                <InputLabel>Subcategory</InputLabel>
                <Select
                  value={formData.subcategory_id}
                  label="Subcategory"
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                >
                  {getFilteredSubcategories().map((subcategory) => (
                    <MenuItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Dynamic Attributes Section */}
            {getSelectedSubcategory() && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Product Attributes
                  </Typography>
                </Grid>
                
                {getSelectedSubcategory()?.attribute_schema?.required_fields?.map((fieldName) => {
                  const fieldType = getSelectedSubcategory()?.attribute_schema?.field_types?.[fieldName] || 'text';
                  return (
                    <Grid item xs={12} sm={6} key={fieldName}>
                      {renderAttributeField(fieldName, fieldType)}
                    </Grid>
                  );
                })}
              </>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Inventory Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </Grid>

                         <Grid item xs={12} sm={4}>
               <TextField
                 fullWidth
                 label="Unit Price"
                 type="number"
                 value={formData.unit_price}
                 onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                 required
                 inputProps={{ step: 0.01 }}
               />
             </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Reorder Level"
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Notes"
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
          <Button onClick={handleSubmit} variant="contained">
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products; 