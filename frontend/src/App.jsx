import { useEffect, useState } from "react";
import API from "./api/userApi";
import ArcadeCabinet from "./components/ArcadeCabinet";

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

  // States for Games
  const [games, setGames] = useState([]);
  const [gameSearchQuery, setGameSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [gameForm, setGameForm] = useState({
    title: "",
    description: "",
    genre: "",
    platform: "",
    release_year: "",
    rating: "",
    price: "",
    image_url: "",
  });
  const [editingGameId, setEditingGameId] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);

  // States for Interactive Play Mode
  const [activePlayGame, setActivePlayGame] = useState(null); // stores game object when playing
  const [arcadeHighScore, setArcadeHighScore] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("arcade_high_scores") || "{}");
    } catch {
      return {};
    }
  });

  // States for Dashboard Stats
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_games: 0,
    total_stock: 0,
    total_inventory_value: 0,
    avg_product_price: 0,
    recent_users: [],
    recent_products: [],
    recent_games: [],
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
          recent_games: Array.isArray(response.data.recent_games) ? response.data.recent_games : [],
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

  // Fetch Games
  const fetchGames = async () => {
    try {
      const response = await API.get("/games");
      if (Array.isArray(response.data)) {
        setGames(response.data);
      } else {
        console.error("Expected an array of games, but got:", response.data);
        setGames([]);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      showToast("Failed to fetch games", "error");
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchUsers(), fetchProducts(), fetchGames()]).finally(() => {
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

  // Handle Game Create / Update
  const handleGameSubmit = async (e) => {
    e.preventDefault();
    if (!gameForm.title || !gameForm.genre || !gameForm.platform || !gameForm.release_year || !gameForm.rating || !gameForm.price) {
      showToast("Please fill in all required game fields", "error");
      return;
    }

    const payload = {
      title: gameForm.title,
      description: gameForm.description || "",
      genre: gameForm.genre,
      platform: gameForm.platform,
      release_year: parseInt(gameForm.release_year, 10),
      rating: parseFloat(gameForm.rating),
      price: parseFloat(gameForm.price),
      image_url: gameForm.image_url || "",
    };

    if (isNaN(payload.release_year) || payload.release_year < 1950 || payload.release_year > 2100) {
      showToast("Release year must be a valid year", "error");
      return;
    }
    if (isNaN(payload.rating) || payload.rating < 0 || payload.rating > 10) {
      showToast("Rating must be between 0 and 10", "error");
      return;
    }
    if (isNaN(payload.price) || payload.price < 0) {
      showToast("Price must be a valid positive number", "error");
      return;
    }

    try {
      if (editingGameId) {
        // Update Game
        await API.put(`/games/${editingGameId}`, payload);
        showToast("Game updated successfully!");
      } else {
        // Create Game
        await API.post("/games", payload);
        showToast("Game created successfully!");
      }
      // Reset form and modal
      setGameForm({ title: "", description: "", genre: "", platform: "", release_year: "", rating: "", price: "", image_url: "" });
      setEditingGameId(null);
      setShowGameModal(false);
      fetchGames();
      fetchStats();
    } catch (error) {
      console.error("Error submitting game:", error);
      showToast(error.response?.data?.detail || "An error occurred with game operation", "error");
    }
  };

  // Setup Game Editing
  const openEditGame = (game) => {
    setEditingGameId(game.id);
    setGameForm({
      title: game.title,
      description: game.description || "",
      genre: game.genre,
      platform: game.platform,
      release_year: game.release_year.toString(),
      rating: game.rating.toString(),
      price: game.price.toString(),
      image_url: game.image_url || "",
    });
    setShowGameModal(true);
  };

  // Delete Game
  const handleDeleteGame = async (id) => {
    if (!window.confirm("Are you sure you want to delete this game?")) return;
    try {
      await API.delete(`/games/${id}`);
      showToast("Game deleted successfully!");
      fetchGames();
      fetchStats();
    } catch (error) {
      console.error("Error deleting game:", error);
      showToast("Failed to delete game", "error");
    }
  };

  // Update high score helper
  const updateArcadeHighScore = (gameTitle, newScore) => {
    setArcadeHighScore((prev) => {
      const currentHigh = prev[gameTitle] || 0;
      if (newScore > currentHigh) {
        const updated = { ...prev, [gameTitle]: newScore };
        localStorage.setItem("arcade_high_scores", JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // Filtering Logic for Games
  const filteredGames = Array.isArray(games)
    ? games.filter((game) => {
        const matchesSearch =
          game.title?.toLowerCase().includes(gameSearchQuery.toLowerCase()) ||
          (game.description && game.description.toLowerCase().includes(gameSearchQuery.toLowerCase())) ||
          game.genre?.toLowerCase().includes(gameSearchQuery.toLowerCase()) ||
          game.platform?.toLowerCase().includes(gameSearchQuery.toLowerCase());

        const matchesGenre = selectedGenre === "All" || game.genre === selectedGenre;
        const matchesPlatform = selectedPlatform === "All" || game.platform?.toLowerCase().includes(selectedPlatform.toLowerCase());

        return matchesSearch && matchesGenre && matchesPlatform;
      })
    : [];

  // Extract unique genres for filter dropdown
  const genres = ["All", ...new Set(Array.isArray(games) ? games.map((g) => g.genre) : [])];
  const platforms = ["All", "PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"];

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

            <button
              onClick={() => setActiveTab("games")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "games"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Games Arena
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
                    Promise.all([fetchStats(), fetchUsers(), fetchProducts(), fetchGames()]).finally(() => setLoading(false));
                  }}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 transition-all rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  Sync Live Data
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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

                {/* Games Stat Card */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Games in System</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{stats.total_games || 0}</h3>
                    </div>
                    <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-slate-500">
                    <span className="font-bold text-slate-700">{stats.total_games || 0}</span> active titles
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

              {/* Split Feed Grid (Recent Users / Recent Products / Recent Games) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                {/* Recent Games List */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Recently Added Games</h3>
                      <p className="text-xs text-slate-400 font-medium">Fresh titles in database</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("games")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      View Arena
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {!stats.recent_games || stats.recent_games.length === 0 ? (
                      <p className="text-sm text-center text-slate-400 py-6">No recent games found.</p>
                    ) : (
                      stats.recent_games.map((g) => (
                        <div key={g.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-fuchsia-100 text-fuchsia-700 font-bold text-xs flex items-center justify-center">
                              GAME
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{g.title}</p>
                              <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-100 px-1.5 py-0.5 rounded-md uppercase">
                                {g.genre}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-extrabold text-slate-800">{formatCurrency(g.price)}</p>
                            <p className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 justify-end">
                              ★ {g.rating?.toFixed(1)}
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

          {/* TAB 4: GAMES ARENA VIEW */}
          {activeTab === "games" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Games Arena</h1>
                  <p className="text-sm text-slate-400 font-medium">Add, manage, review, and organize video games in your system.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingGameId(null);
                    setGameForm({ title: "", description: "", genre: "", platform: "", release_year: "", rating: "", price: "", image_url: "" });
                    setShowGameModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Game
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
                    placeholder="Search game title, genre, platform..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    value={gameSearchQuery}
                    onChange={(e) => setGameSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Genre</label>
                    <select
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                    >
                      {genres.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Platform</label>
                    <select
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                    >
                      {platforms.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Games Grid */}
              {filteredGames.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-400 shadow-sm">
                  No games matching the description. Add some games or adjust search queries.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredGames.map((game) => (
                    <div key={game.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col group animate-fade-in">
                      {/* Game Cover Image */}
                      <div className="h-48 w-full overflow-hidden bg-slate-100 relative shrink-0">
                        {game.image_url ? (
                          <img
                            src={game.image_url}
                            alt={game.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = ""; // Clear on error to fallback
                            }}
                          />
                        ) : null}
                        {/* Fallback/Overlay Gradient if image missing or fails */}
                        {(!game.image_url) && (
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xl tracking-wider uppercase p-4 text-center">
                            {game.title}
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span>{game.rating?.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Game Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {game.genre}
                            </span>
                            <span className="text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {game.release_year}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-blue-600 transition-colors">
                              {game.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-1.5 line-clamp-2">
                              {game.description || "No description provided."}
                            </p>
                          </div>

                          <div className="pt-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platforms</p>
                            <p className="text-xs font-semibold text-slate-600 mt-0.5">{game.platform}</p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-lg font-black text-slate-800">
                            {formatCurrency(game.price)}
                          </span>

                          <div className="flex gap-1.5 items-center">
                            <button
                              onClick={() => setActivePlayGame(game)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              title="Play game inside project"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Play
                            </button>
                            <button
                              onClick={() => openEditGame(game)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all cursor-pointer"
                              title="Edit game details"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteGame(game.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Delete game"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* GAME SLIDING PANEL MODAL */}
      {showGameModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {editingGameId ? "Edit Game Details" : "Add New Game"}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Please provide specifications for the video game.</p>
              </div>
              <button
                onClick={() => setShowGameModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGameSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Game Title</label>
                <input
                  type="text"
                  placeholder="e.g. Witcher 3, Cyberpunk 2077"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                  value={gameForm.title}
                  onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Game Description</label>
                <textarea
                  placeholder="e.g. An open-world action RPG set in a fantasy universe..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all h-20 resize-none"
                  value={gameForm.description}
                  onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Genre</label>
                  <input
                    type="text"
                    placeholder="e.g. RPG, Action, Sandbox"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                    value={gameForm.genre}
                    onChange={(e) => setGameForm({ ...gameForm, genre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Platforms</label>
                  <input
                    type="text"
                    placeholder="e.g. PC, PlayStation, Xbox"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                    value={gameForm.platform}
                    onChange={(e) => setGameForm({ ...gameForm, platform: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Release Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 2022"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                    value={gameForm.release_year}
                    onChange={(e) => setGameForm({ ...gameForm, release_year: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Rating (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 9.5"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                    value={gameForm.rating}
                    onChange={(e) => setGameForm({ ...gameForm, rating: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 59.99"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                    value={gameForm.price}
                    onChange={(e) => setGameForm({ ...gameForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all"
                  value={gameForm.image_url}
                  onChange={(e) => setGameForm({ ...gameForm, image_url: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowGameModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {editingGameId ? "Save Changes" : "Add Game"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCADE CABINET PLAY MODAL */}
      {activePlayGame && (
        <ArcadeCabinet
          game={activePlayGame}
          onClose={() => setActivePlayGame(null)}
          highScore={arcadeHighScore}
          onUpdateHighScore={updateArcadeHighScore}
        />
      )}
    </div>
  );
}

export default App;