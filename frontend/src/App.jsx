import { useEffect, useState } from "react";
import API from "./api/userApi";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  // States for Users
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    contact: "",
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // States for Products
  const [products, setProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // States for Dashboard Stats
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_stock: 0,
    total_inventory_value: 0,
    avg_product_price: 0,
    recent_users: [],
    recent_products: [],
  });

  // States for Toast Notification
  const [toast, setToast] = useState(null);

  // Trigger Toast Notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const response = await API.get("/dashboard/stats");
      if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
        setStats({
          ...response.data,
          recent_users: Array.isArray(response.data.recent_users) ? response.data.recent_users : [],
          recent_products: Array.isArray(response.data.recent_products) ? response.data.recent_products : [],
        });
      } else {
        console.error("Expected a stats object, but got:", response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const response = await API.get("/users");
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error("Expected an array of users, but got:", response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Failed to fetch users", "error");
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      const response = await API.get("/products");
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        console.error("Expected an array of products, but got:", response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to fetch products", "error");
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchUsers(), fetchProducts()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Fetch fresh stats whenever tabs switch to Dashboard
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchStats();
    }
  }, [activeTab]);

  // Handle User Create / Update
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.contact) {
      showToast("Please fill all user fields", "error");
      return;
    }

    try {
      if (editingUserId) {
        // Update User
        await API.put(`/users/${editingUserId}`, userForm);
        showToast("User updated successfully!");
      } else {
        // Create User
        await API.post("/users", userForm);
        showToast("User created successfully!");
      }
      // Reset form and modal
      setUserForm({ name: "", email: "", contact: "" });
      setEditingUserId(null);
      setShowUserModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error submitting user:", error);
      showToast(error.response?.data?.detail || "An error occurred with user operation", "error");
    }
  };

  // Setup User Editing
  const openEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      contact: user.contact,
    });
    setShowUserModal(true);
  };

  // Delete User
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/users/${id}`);
      showToast("User deleted successfully!");
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("Failed to delete user", "error");
    }
  };

  // Handle Product Create / Update
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.stock || !productForm.category) {
      showToast("Please fill in all required product fields", "error");
      return;
    }

    const payload = {
      name: productForm.name,
      description: productForm.description || "",
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock, 10),
      category: productForm.category,
    };

    if (isNaN(payload.price) || payload.price < 0) {
      showToast("Price must be a valid positive number", "error");
      return;
    }
    if (isNaN(payload.stock) || payload.stock < 0) {
      showToast("Stock must be a valid positive integer", "error");
      return;
    }

    try {
      if (editingProductId) {
        // Update Product
        await API.put(`/products/${editingProductId}`, payload);
        showToast("Product updated successfully!");
      } else {
        // Create Product
        await API.post("/products", payload);
        showToast("Product created successfully!");
      }
      // Reset form and modal
      setProductForm({ name: "", description: "", price: "", stock: "", category: "" });
      setEditingProductId(null);
      setShowProductModal(false);
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error("Error submitting product:", error);
      showToast(error.response?.data?.detail || "An error occurred with product operation", "error");
    }
  };

  // Setup Product Editing
  const openEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
    });
    setShowProductModal(true);
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      showToast("Product deleted successfully!");
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Failed to delete product", "error");
    }
  };

  // Helper: Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filtering Logic
  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (user) =>
          user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          user.contact?.includes(userSearchQuery)
      )
    : [];

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        const matchesSearch =
          product.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(productSearchQuery.toLowerCase())) ||
          product.category?.toLowerCase().includes(productSearchQuery.toLowerCase());

        const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
    : [];

  // Extract unique categories for filter dropdown
  const categories = ["All", ...new Set(Array.isArray(products) ? products.map((p) => p.category) : [])];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-white border border-slate-200 shadow-xl rounded-xl p-4 animate-bounce">
          <div
            className={`p-2 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-100 text-emerald-600"
                : "bg-rose-100 text-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Sidebar navigation */}
      <div className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg font-bold shadow-md shadow-blue-500/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight tracking-wider text-slate-100">NEXUS</h2>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">CONTROL PANEL</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users Directory
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "products"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Product Catalog
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">FastAPI + React SaaS App</p>
          <p className="mt-0.5">V4 Premium Layout</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
              Local Dev Server
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </div>
            )}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md text-sm">
                VK
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">Rahul S.</p>
                <p className="text-[10px] font-semibold text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              {/* Dash Welcome Banner */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-6 shadow-lg shadow-blue-700/10">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, Rahul!</h1>
                  <p className="text-blue-100 text-sm mt-1">Here is a quick snapshot of your systems, users, and catalog inventory.</p>
                </div>
                <button
                  onClick={() => {
                    setLoading(true);
                    Promise.all([fetchStats(), fetchUsers(), fetchProducts()]).finally(() => setLoading(false));
                  }}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 transition-all rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  Sync Live Data
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users Stat Card */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Users</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{stats.total_users}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 text-xs font-bold text-emerald-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>+100% System Online</span>
                  </div>
                </div>

                {/* Products Stat Card */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Products in Catalog</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{stats.total_products}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-slate-500">
                    <span className="font-bold text-slate-700">{stats.total_stock}</span> total items in stock
                  </div>
                </div>

                {/* Inventory Value Card */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Stock Value</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                        {formatCurrency(stats.total_inventory_value)}
                      </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-500">
                    <span>Valued at retail price list</span>
                  </div>
                </div>

                {/* Avg Product Price Card */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Product Price</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                        {formatCurrency(stats.avg_product_price)}
                      </h3>
                    </div>
                    <div className="p-3 bg-amber-50 text-yellow-600 rounded-xl">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-slate-500">
                    <span>Based on current active listings</span>
                  </div>
                </div>
              </div>

              {/* Alert for low stock */}
              {products.some((p) => p.stock <= 5) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                  <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm">Critical Inventory Advisory</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Some high-demand items in your product catalog are low or out of stock. Customers cannot checkout these items once stock hits zero.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(Array.isArray(products) ? products : [])
                        .filter((p) => p.stock <= 5)
                        .slice(0, 4)
                        .map((p) => (
                          <span
                            key={p.id}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.stock === 0
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {p.name} ({p.stock} left)
                          </span>
                        ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-all rounded-lg px-3 py-1.5 cursor-pointer"
                  >
                    Restock
                  </button>
                </div>
              )}

              {/* Split Feed Grid (Recent Users / Recent Products) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Users List */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Recently Registered Users</h3>
                      <p className="text-xs text-slate-400 font-medium">Last 5 active accounts</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      View All Users
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {stats.recent_users.length === 0 ? (
                      <p className="text-sm text-center text-slate-400 py-6">No recent users found.</p>
                    ) : (
                      stats.recent_users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{u.name}</p>
                              <p className="text-xs text-slate-400 font-semibold">{u.email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1">
                            ID: {u.id}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Products List */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Recently Added Products</h3>
                      <p className="text-xs text-slate-400 font-medium">Fresh items in inventory</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("products")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      View Catalog
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {stats.recent_products.length === 0 ? (
                      <p className="text-sm text-center text-slate-400 py-6">No recent products found.</p>
                    ) : (
                      stats.recent_products.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              ITEM
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{p.name}</p>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md uppercase">
                                {p.category}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-extrabold text-slate-800">{formatCurrency(p.price)}</p>
                            <p
                              className={`text-[10px] font-bold ${
                                p.stock === 0 ? "text-red-500" : "text-slate-400"
                              }`}
                            >
                              {p.stock === 0 ? "Out of Stock" : `${p.stock} units left`}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS DIRECTORY VIEW */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Users Directory</h1>
                  <p className="text-sm text-slate-400 font-medium">Add, manage, update or delete user accounts on this system.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingUserId(null);
                    setUserForm({ name: "", email: "", contact: "" });
                    setShowUserModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Account
                </button>
              </div>

              {/* Action and Search Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center">
                <div className="relative w-full max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search accounts by name, email or contact..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User Account</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-12 text-center text-sm text-slate-400">
                            No matching user records found. Try a different search query.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-sm">
                                  {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-800">{user.name}</div>
                                  <div className="text-xs text-slate-400 font-semibold">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                              {user.contact}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => openEditUser(user)}
                                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all cursor-pointer"
                                  title="Edit user details"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                  title="Delete user account"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT CATALOG VIEW */}
          {activeTab === "products" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Product Catalog</h1>
                  <p className="text-sm text-slate-400 font-medium">Add, edit, restock, or remove commercial items inside your inventory.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm({ name: "", description: "", price: "", stock: "", category: "" });
                    setShowProductModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Product
                </button>
              </div>

              {/* Action, Search, & Filtering bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
                <div className="relative w-full max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search product name, category or details..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Category Filter</label>
                  <select
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Product Info</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-400">
                            No product inventory matching the description. Add some products or adjust searches.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-bold text-slate-800">{p.name}</div>
                                {p.description ? (
                                  <div className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-xs font-medium">
                                    {p.description}
                                  </div>
                                ) : (
                                  <div className="text-xs italic text-slate-300 font-medium">No description provided.</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {p.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-800">
                              {formatCurrency(p.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    p.stock === 0
                                      ? "bg-rose-500 animate-pulse"
                                      : p.stock <= 5
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                />
                                <span
                                  className={`text-xs font-extrabold ${
                                    p.stock === 0
                                      ? "text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg"
                                      : p.stock <= 5
                                      ? "text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {p.stock === 0
                                    ? "Out of Stock"
                                    : p.stock <= 5
                                    ? `Low Stock (${p.stock} units)`
                                    : `${p.stock} available`}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => openEditProduct(p)}
                                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all cursor-pointer"
                                  title="Edit item attributes"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                  title="Delete item from inventory"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* USER SLIDING PANEL MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {editingUserId ? "Edit User Record" : "Add New Account"}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Please provide correct identification details.</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Solanki"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. Rahul@example.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0199"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                  value={userForm.contact}
                  onChange={(e) => setUserForm({ ...userForm, contact: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {editingUserId ? "Save Changes" : "Register Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT SLIDING PANEL MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {editingProductId ? "Edit Catalog Item" : "Create New Product"}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Please provide specifications for current inventory.</p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ultra-thin OLED Monitor"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Product Description</label>
                <textarea
                  placeholder="e.g. 4K high resolution, HDR600 color fidelity..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all h-20 resize-none"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 299.99"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Stock Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Electronics, Furniture, Stationery"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {editingProductId ? "Save Changes" : "Add to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;