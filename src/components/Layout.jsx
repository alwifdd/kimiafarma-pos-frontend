// src/components/Layout.jsx
import { Link, Outlet } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";

function Layout() {
  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar Navigasi */}
      <Box
        sx={{
          width: 240,
          flexShrink: 0,
          bgcolor: "background.paper",
          height: "100vh",
          borderRight: "1px solid #ddd",
        }}
      >
        <List>
          <ListItem>
            <Typography variant="h6">Kimia Farma POS</Typography>
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/">
              <ListItemText primary="Dashboard Pesanan" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/products">
              <ListItemText primary="Manajemen Produk" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Konten Halaman Utama */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
