import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase.ts';

interface MainCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
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
  created_at: string;
  updated_at: string;
  created_by?: string;
  main_category?: MainCategory;
}

const Categories: React.FC = () => {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainCategoryOpen, setMainCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [editingMainCategory, setEditingMainCategory] = useState<MainCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [mainCategoryForm, setMainCategoryForm] = useState({
    name: '',
    description: ''
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    main_category_id: '',
    name: '',
    description: '',
    required_fields: [''],
    field_types: [{ field: '', type: 'text' }]
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
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

      setMainCategories(mainCatsData || []);
      setSubcategories(subcatsData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setAlert({ type: 'error', message: 'Failed to fetch categories' });
    } finally {
      setLoading(false);
    }
  };

  const handleMainCategorySubmit = async () => {
    try {
      if (editingMainCategory) {
        const { error } = await supabase
          .from('main_categories')
          .update({
            name: mainCategoryForm.name,
            description: mainCategoryForm.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMainCategory.id);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Main category updated successfully' });
      } else {
        const { error } = await supabase
          .from('main_categories')
          .insert([{
            name: mainCategoryForm.name,
            description: mainCategoryForm.description
          }]);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Main category created successfully' });
      }

      fetchCategories();
      handleMainCategoryClose();
    } catch (error) {
      console.error('Error saving main category:', error);
      setAlert({ type: 'error', message: 'Failed to save main category' });
    }
  };

  const handleSubcategorySubmit = async () => {
    try {
      const attributeSchema: AttributeSchema = {
        required_fields: subcategoryForm.required_fields.filter(field => field.trim() !== ''),
        field_types: subcategoryForm.field_types.reduce((acc, item) => {
          if (item.field.trim() !== '') {
            acc[item.field] = item.type;
          }
          return acc;
        }, {} as Record<string, string>)
      };

      if (editingSubcategory) {
        const { error } = await supabase
          .from('subcategories')
          .update({
            main_category_id: subcategoryForm.main_category_id,
            name: subcategoryForm.name,
            description: subcategoryForm.description,
            attribute_schema: attributeSchema,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSubcategory.id);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Subcategory updated successfully' });
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert([{
            main_category_id: subcategoryForm.main_category_id,
            name: subcategoryForm.name,
            description: subcategoryForm.description,
            attribute_schema: attributeSchema
          }]);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Subcategory created successfully' });
      }

      fetchCategories();
      handleSubcategoryClose();
    } catch (error) {
      console.error('Error saving subcategory:', error);
      setAlert({ type: 'error', message: 'Failed to save subcategory' });
    }
  };

  const handleDeleteMainCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this main category? This will also delete all subcategories.')) {
      try {
        const { error } = await supabase
          .from('main_categories')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Main category deleted successfully' });
        fetchCategories();
      } catch (error) {
        console.error('Error deleting main category:', error);
        setAlert({ type: 'error', message: 'Failed to delete main category' });
      }
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subcategory?')) {
      try {
        const { error } = await supabase
          .from('subcategories')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Subcategory deleted successfully' });
        fetchCategories();
      } catch (error) {
        console.error('Error deleting subcategory:', error);
        setAlert({ type: 'error', message: 'Failed to delete subcategory' });
      }
    }
  };

  const handleEditMainCategory = (category: MainCategory) => {
    setEditingMainCategory(category);
    setMainCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setMainCategoryOpen(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      main_category_id: subcategory.main_category_id,
      name: subcategory.name,
      description: subcategory.description || '',
      required_fields: subcategory.attribute_schema.required_fields || [''],
      field_types: Object.entries(subcategory.attribute_schema.field_types || {}).map(([field, type]) => ({ field, type }))
    });
    setSubcategoryOpen(true);
  };

  const handleMainCategoryClose = () => {
    setMainCategoryOpen(false);
    setEditingMainCategory(null);
    setMainCategoryForm({ name: '', description: '' });
  };

  const handleSubcategoryClose = () => {
    setSubcategoryOpen(false);
    setEditingSubcategory(null);
    setSubcategoryForm({
      main_category_id: '',
      name: '',
      description: '',
      required_fields: [''],
      field_types: [{ field: '', type: 'text' }]
    });
  };

  const addRequiredField = () => {
    setSubcategoryForm({
      ...subcategoryForm,
      required_fields: [...subcategoryForm.required_fields, '']
    });
  };

  const addFieldType = () => {
    setSubcategoryForm({
      ...subcategoryForm,
      field_types: [...subcategoryForm.field_types, { field: '', type: 'text' }]
    });
  };

  const updateRequiredField = (index: number, value: string) => {
    const newFields = [...subcategoryForm.required_fields];
    newFields[index] = value;
    setSubcategoryForm({ ...subcategoryForm, required_fields: newFields });
  };

  const updateFieldType = (index: number, field: string, type: string) => {
    const newFieldTypes = [...subcategoryForm.field_types];
    newFieldTypes[index] = { field, type };
    setSubcategoryForm({ ...subcategoryForm, field_types: newFieldTypes });
  };

  const removeRequiredField = (index: number) => {
    if (subcategoryForm.required_fields.length > 1) {
      const newFields = subcategoryForm.required_fields.filter((_, i) => i !== index);
      setSubcategoryForm({ ...subcategoryForm, required_fields: newFields });
    }
  };

  const removeFieldType = (index: number) => {
    if (subcategoryForm.field_types.length > 1) {
      const newFieldTypes = subcategoryForm.field_types.filter((_, i) => i !== index);
      setSubcategoryForm({ ...subcategoryForm, field_types: newFieldTypes });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading categories...</Typography>
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
          Categories Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setMainCategoryOpen(true)}
          >
            Add Main Category
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setSubcategoryOpen(true)}
          >
            Add Subcategory
          </Button>
        </Box>
      </Box>

      {/* Main Categories Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon color="primary" />
            Main Categories
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Subcategories</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mainCategories.map((category) => {
                  const categorySubcats = subcategories.filter(sub => sub.main_category_id === category.id);
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {category.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {category.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${categorySubcats.length} subcategories`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(category.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEditMainCategory(category)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMainCategory(category.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {mainCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No main categories found. Create your first main category to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Subcategories Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon color="secondary" />
            Subcategories
          </Typography>
          {mainCategories.map((mainCategory) => {
            const categorySubcats = subcategories.filter(sub => sub.main_category_id === mainCategory.id);
            if (categorySubcats.length === 0) return null;

            return (
              <Accordion key={mainCategory.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {mainCategory.name} ({categorySubcats.length} subcategories)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Required Fields</TableCell>
                          <TableCell>Field Types</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categorySubcats.map((subcategory) => (
                          <TableRow key={subcategory.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {subcategory.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {subcategory.description || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {subcategory.attribute_schema.required_fields?.map((field, index) => (
                                  <Chip key={index} label={field} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {Object.entries(subcategory.attribute_schema.field_types || {}).map(([field, type]) => (
                                  <Chip key={field} label={`${field}: ${type}`} size="small" />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleEditSubcategory(subcategory)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSubcategory(subcategory.id)}
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
            );
          })}
          {subcategories.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No subcategories found. Create subcategories within main categories.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Main Category Dialog */}
      <Dialog open={mainCategoryOpen} onClose={handleMainCategoryClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMainCategory ? 'Edit Main Category' : 'Add New Main Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={mainCategoryForm.name}
            onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={mainCategoryForm.description}
            onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMainCategoryClose}>Cancel</Button>
          <Button onClick={handleMainCategorySubmit} variant="contained">
            {editingMainCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subcategoryOpen} onClose={handleSubcategoryClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Main Category</InputLabel>
                <Select
                  value={subcategoryForm.main_category_id}
                  label="Main Category"
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, main_category_id: e.target.value })}
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
              <TextField
                fullWidth
                label="Subcategory Name"
                variant="outlined"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                value={subcategoryForm.description}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>Attribute Schema</Typography>
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Required Fields:</Typography>
              {subcategoryForm.required_fields.map((field, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label={`Required Field ${index + 1}`}
                    value={field}
                    onChange={(e) => updateRequiredField(index, e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button onClick={() => removeRequiredField(index)}>Remove</Button>
                </Box>
              ))}
              <Button onClick={addRequiredField} sx={{ mb: 2 }}>Add Required Field</Button>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Field Types:</Typography>
              {subcategoryForm.field_types.map((fieldType, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label="Field Name"
                    value={fieldType.field}
                    onChange={(e) => updateFieldType(index, e.target.value, fieldType.type)}
                    sx={{ flex: 1 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={fieldType.type}
                      label="Type"
                      onChange={(e) => updateFieldType(index, fieldType.field, e.target.value)}
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="url">URL</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                    </Select>
                  </FormControl>
                  <Button onClick={() => removeFieldType(index)}>Remove</Button>
                </Box>
              ))}
              <Button onClick={addFieldType}>Add Field Type</Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubcategoryClose}>Cancel</Button>
          <Button onClick={handleSubcategorySubmit} variant="contained">
            {editingSubcategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories; 