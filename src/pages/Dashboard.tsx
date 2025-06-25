import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  CurrencyRupee as RupeeIcon,
  Warning as WarningIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase.ts';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalSubcategories: number;
  totalSales: number;
  totalRevenue: number;
  lowStockProducts: number;
  todaysSales: number;
  todaysRevenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorder_level: number;
  main_category?: { name: string };
}

interface RecentSale {
  id: string;
  sale_number: string;
  customer_name?: string;
  total_amount: number;
  payment_method: string;
  sale_date: string;
  items_count: number;
}

interface CategorySales {
  category_name: string;
  total_sales: number;
  total_revenue: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    totalSales: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    todaysSales: 0,
    todaysRevenue: 0
  });
  
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toFixed(2);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch products count and low stock
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          main_category:main_categories(name)
        `);

      if (productsError) throw productsError;

             // Fetch categories count
       const { data: mainCategories, error: mainCategoriesError } = await supabase
         .from('main_categories')
         .select('*');

       if (mainCategoriesError) throw mainCategoriesError;

      // Fetch subcategories count
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('id');

      if (subcategoriesError) throw subcategoriesError;

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(quantity)
        `);

      if (salesError) throw salesError;

      // Fetch recent sales with items count
      const { data: recentSalesData, error: recentSalesError } = await supabase
        .from('sales')
        .select(`
          id,
          sale_number,
          customer_name,
          total_amount,
          payment_method,
          sale_date,
          sale_items(quantity)
        `)
        .order('sale_date', { ascending: false })
        .limit(10);

      if (recentSalesError) throw recentSalesError;

             // Process data
       const lowStock = products?.filter(p => p.quantity <= p.reorder_level) || [];
       
       const today = new Date().toISOString().split('T')[0];
       const todaysSales = sales?.filter(s => s.sale_date.startsWith(today)) || [];
       
       const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
       const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total_amount, 0);

       // Process category sales from products
       const categoryMap = new Map<string, { sales: number, revenue: number }>();
       
       // Simplified category processing - using main categories directly
       mainCategories?.forEach(category => {
         const categoryProducts = products?.filter(p => p.main_category_id === category.id) || [];
         const categoryRevenue = categoryProducts.reduce((sum, product) => {
           return sum + (product.unit_price * product.quantity);
         }, 0);
         
         categoryMap.set(category.name, {
           sales: categoryProducts.reduce((sum, product) => sum + product.quantity, 0),
           revenue: categoryRevenue
         });
       });

       const categoryStatsArray = Array.from(categoryMap.entries()).map(([name, data]) => ({
         category_name: name,
         total_sales: data.sales,
         total_revenue: data.revenue
       }));

      // Process recent sales
      const processedRecentSales = recentSalesData?.map(sale => ({
        ...sale,
        items_count: sale.sale_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
      })) || [];

      // Update state
      setStats({
        totalProducts: products?.length || 0,
        totalCategories: mainCategories?.length || 0,
        totalSubcategories: subcategories?.length || 0,
        totalSales: sales?.length || 0,
        totalRevenue,
        lowStockProducts: lowStock.length,
        todaysSales: todaysSales.length,
        todaysRevenue
      });

      setLowStockProducts(lowStock.slice(0, 10));
      setRecentSales(processedRecentSales);
      setCategorySales(categoryStatsArray.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setAlert({ type: 'error', message: 'Failed to fetch dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    subtitle?: string;
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>
            {icon}
          </Box>
          <Typography variant="h6" color={`${color}.main`}>
            {value}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Dashboard</Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>Loading dashboard data...</Typography>
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

      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<InventoryIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Categories"
            value={`${stats.totalCategories}/${stats.totalSubcategories}`}
            subtitle="Main/Sub categories"
            icon={<CategoryIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={stats.totalSales}
            icon={<ShoppingCartIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue.toFixed(2)}
            icon={<RupeeIcon />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Today's Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Today's Sales"
            value={stats.todaysSales}
            icon={<TrendingUpIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Today's Revenue"
            value={stats.todaysRevenue.toFixed(2)}
            icon={<RupeeIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockProducts}
            icon={<WarningIcon />}
            color={stats.lowStockProducts > 0 ? "warning" : "success"}
          />
        </Grid>
      </Grid>

      {/* Alerts */}
      {stats.lowStockProducts > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {stats.lowStockProducts} products are running low on stock and need restocking.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Low Stock Products */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                Low Stock Products
              </Typography>
              {lowStockProducts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell align="right">Reorder Level</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={product.main_category?.name || 'N/A'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={product.quantity}
                              color="error"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {product.reorder_level}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  All products are well stocked!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sales */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon color="primary" />
                Recent Sales
              </Typography>
              {recentSales.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sale #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Items</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {sale.sale_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {sale.customer_name || 'Walk-in'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {sale.items_count}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              ₹{sale.total_amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No sales data available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Category Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="secondary" />
                Category Performance
              </Typography>
              {categorySales.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Total Sales (Units)</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Avg. Sale Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categorySales.map((category) => (
                        <TableRow key={category.category_name}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {category.category_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {category.total_sales}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              ₹{category.total_revenue.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              ₹{category.total_sales > 0 ? (category.total_revenue / category.total_sales).toFixed(2) : '0.00'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No category sales data available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 