
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistUrl, setWishlistUrl] = useState("");
  const [showWishlistPopup, setShowWishlistPopup] = useState(false);
  const [showPfpMenu, setShowPfpMenu] = useState(false);
  const [showPfpViewer, setShowPfpViewer] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [toast, setToast] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [addingWishlist, setAddingWishlist] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  async function loadProfile() {
    try {
      const res = await API.get("/user/me");

      setProfile({
        fullName: res.data.name,
        username: res.data.username || "explorer",
        email: res.data.email,
        location: res.data.location || "",
        pfp: res.data.profilePicture || "https://i.pravatar.cc/150"
      });

      setEditFullName(res.data.name);
      setEditLocation(res.data.location || "");
      setWishlist(res.data.wishlist || []);
    } catch (err) {
      console.error("Profile load error:", err);
    }
  }

  async function addWishlistItem() {
    if (!wishlistUrl.trim()) return;

    if (!wishlistUrl.includes("amazon")) {
      showNotification("Drop an Amazon link here — I'll compare the other stores for you");
      return;
    }

    try {
      setAddingWishlist(true);
      const source = "amazon";

      const res = await API.post("/product/metadata", {
        productUrl: wishlistUrl,
        source
      });

      const product = res.data;

      await API.post("/user/add-wishlist", {
        productUrl: wishlistUrl,
        title: product.title,
        image: product.image,
        source: product.source
      });

      setWishlistUrl("");
      setShowWishlistPopup(false);
      showNotification("Product stored in wishlist queue");
      loadProfile();
    } catch (err) {
      console.error("Wishlist metadata error:", err);
      showNotification("Failed to fetch product metadata");
    } finally {
      setAddingWishlist(false);
    }
  }

  async function startTracking(item) {
    try {
      if (!item || !item.productUrl) return;

      const source = item.productUrl.includes("amazon") ? "amazon" : "flipkart";

      await API.post("/product/add", {
        productUrl: item.productUrl,
        source
      });

      await API.delete(`/user/wishlist/${item._id}`);
      showNotification("Target promoted to Active Surveillance!");
      loadProfile();
    } catch (err) {
      console.error("Tracking error:", err);
      showNotification("Failed to initiate tracking");
    }
  }

  async function removeWishlistItem(productId) {
    try {
      await API.delete(`/user/wishlist/${productId}`);
      showNotification("Item removed from wishlist");
      loadProfile();
    } catch (err) {
      console.error(err);
    }
  }

  async function saveProfile() {
    try {
      await API.put("/user/update-profile", {
        name: editFullName,
        location: editLocation,
        email: profile.email
      });

      setProfile((prev) => ({
        ...prev,
        fullName: editFullName,
        location: editLocation
      }));

      setShowEditPopup(false);
      showNotification("Explorer credentials updated");
    } catch (err) {
      console.error("Profile update error:", err);
      showNotification("Failed to update profile");
    }
  }

  async function handlePfpUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("pfp", file);
    formData.append("email", profile.email);

    try {
      const res = await API.post("/user/upload-pfp", formData);
      setProfile((prev) => ({
        ...prev,
        pfp: res.data.profilePicture
      }));
      setShowPfpMenu(false);
      showNotification("Avatar hologram updated");
    } catch (err) {
      console.error("PFP upload error:", err);
      showNotification("Failed to upload avatar");
    }
  }

  if (!profile) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-zinc-400">Loading user matrix profile...</span>
      </div>
    );
  }

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const pfpSrc =
    profile.pfp && profile.pfp.startsWith("http")
      ? profile.pfp
      : `${apiBase}/${profile.pfp}`;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-14 right-8 bg-[#0B1E12] border border-[#39FF14] text-[#f4ffe0] px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(57,255,20,0.3)] z-50 flex items-center gap-3 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping"></span>
          {toast}
        </div>
      )}

      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zemo-card border border-zemo-border text-zinc-400 hover:text-[#39FF14] hover:border-[#39FF14]/50 transition-all text-xs font-mono"
        >
          <span>←</span>
          <span>Return to Radar</span>
        </button>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#0D3B16] border border-[#164E22] text-[#39FF14]">
          Matrix Pass: ACTIVE
        </span>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-gradient-to-br from-[#0B1E12] via-[#060907] to-[#0B1E12] border border-[#163E22] p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          
          {/* Avatar with Portal Ring */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl p-1 bg-gradient-to-tr from-[#164E22] to-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.3)]">
              <img
                src={pfpSrc}
                alt="Profile Avatar"
                onClick={() => setShowPfpMenu(true)}
                className="w-full h-full object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity bg-black"
              />
            </div>
            <button
              onClick={() => setShowPfpMenu(true)}
              className="absolute -bottom-2 -right-2 bg-[#0D3B16] border border-[#22C55E] p-1.5 rounded-lg text-xs hover:scale-110 transition-transform text-[#39FF14]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* User Bio */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {profile.fullName}
                  </h1>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0D3B16] text-[#39FF14] border border-[#164E22]">
                    @{profile.username}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {profile.email}
                </p>
              </div>

              <button
                onClick={() => setShowEditPopup(true)}
                className="px-4 py-2 rounded-xl bg-zemo-card border border-zemo-border hover:border-[#39FF14]/50 text-white hover:text-[#39FF14] text-xs font-mono font-bold transition-all self-center sm:self-auto"
              >
                Edit Profile
              </button>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span>{profile.location || "Earth (C-137)"}</span>
              </span>
              <span>•</span>
              <span className="text-[#39FF14] flex items-center gap-1">
                <span>{wishlist.length} In Wishlist</span>
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Wishlist Stage */}
      <div className="bg-zemo-card border border-zemo-border rounded-3xl p-6 sm:p-8 shadow-xl">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zemo-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#CEFF00] shadow-[0_0_8px_#CEFF00]"></span>
              <h2 className="text-xl font-bold text-white tracking-tight font-mono">
                Surveillance Wishlist Queue
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Pre-staged items ready to be deployed into active 15-minute price polling.
            </p>
          </div>

          <button
            onClick={() => setShowWishlistPopup(true)}
            className="px-4 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32E612] text-black text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)] flex items-center gap-2 cursor-pointer"
          >
            <span>+</span>
            <span>Add Wishlist Item</span>
          </button>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-[#060907] border border-zemo-border flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-sm font-mono text-zinc-300 font-semibold">Wishlist Queue is Empty</p>
            <p className="text-xs text-zinc-500 mt-1">Add items to easily promote them into full price surveillance later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlist.map((item, index) => (
              <div
                key={item._id ? item._id.toString() : index}
                className="bg-[#060907] border border-zemo-border hover:border-[#39FF14]/50 p-4 rounded-2xl flex items-center gap-4 transition-all group"
              >
                <div className="w-16 h-16 bg-black rounded-xl border border-zemo-border p-1.5 flex items-center justify-center flex-shrink-0">
                  <img
                    src={
                      item.image && item.image.trim().length > 0
                        ? item.image
                        : "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"
                    }
                    className="max-h-full max-w-full object-contain"
                    alt="product"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#0D3B16] text-[#39FF14] border border-[#164E22]">
                    {item.source || "STORE"}
                  </span>
                  <p className="text-xs font-semibold text-white truncate mt-1 group-hover:text-[#39FF14] transition-colors">
                    {item.title || "Target Product"}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => startTracking(item)}
                    className="px-3 py-1.5 rounded-lg bg-[#0D3B16] border border-[#22C55E]/40 hover:bg-[#39FF14] hover:text-black text-[#39FF14] font-mono text-[11px] font-bold transition-all whitespace-nowrap"
                  >
                    Track
                  </button>

                  <button
                    onClick={() => removeWishlistItem(item._id)}
                    className="px-3 py-1 rounded-lg text-zinc-500 hover:text-red-400 font-mono text-[10px] transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Wishlist Add Modal */}
      {showWishlistPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#0B1E12] border border-[#22C55E] p-6 rounded-3xl max-w-md w-full shadow-[0_0_40px_rgba(57,255,20,0.25)] space-y-4">
            <h3 className="text-lg font-bold text-white font-mono">
              Add Product to Wishlist
            </h3>

            <input
              value={wishlistUrl}
              onChange={(e) => setWishlistUrl(e.target.value)}
              placeholder="Paste Amazon product URL..."
              className="w-full p-3 bg-[#060907] border border-[#163E22] focus:border-[#39FF14] text-white rounded-xl text-xs font-mono outline-none"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={addWishlistItem}
                disabled={addingWishlist}
                className="flex-1 bg-[#39FF14] hover:bg-[#32E612] text-black font-mono font-bold text-xs py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {addingWishlist ? "Extracting..." : "Add to Queue"}
              </button>

              <button
                onClick={() => setShowWishlistPopup(false)}
                className="px-4 bg-zemo-card border border-zemo-border text-zinc-400 hover:text-white font-mono text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#0B1E12] border border-[#22C55E] p-6 rounded-3xl max-w-md w-full shadow-[0_0_40px_rgba(57,255,20,0.25)] space-y-4">
            <h3 className="text-lg font-bold text-white font-mono">
              Edit Matrix Credentials
            </h3>

            <div>
              <label className="text-[10px] font-mono text-zinc-400">Username</label>
              <input
                value={`@${profile.username}`}
                disabled
                className="w-full p-2.5 bg-[#060907] border border-zemo-border text-zinc-500 rounded-xl text-xs font-mono cursor-not-allowed mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400">Full Name</label>
              <input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full p-2.5 bg-[#060907] border border-[#163E22] focus:border-[#39FF14] text-white rounded-xl text-xs font-mono outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400">Dimension / Location</label>
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Dimension C-137, Earth..."
                className="w-full p-2.5 bg-[#060907] border border-[#163E22] focus:border-[#39FF14] text-white rounded-xl text-xs font-mono outline-none mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveProfile}
                className="flex-1 bg-[#39FF14] hover:bg-[#32E612] text-black font-mono font-bold text-xs py-3 rounded-xl transition-all"
              >
                Save Changes
              </button>

              <button
                onClick={() => setShowEditPopup(false)}
                className="px-4 bg-zemo-card border border-zemo-border text-zinc-400 hover:text-white font-mono text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Menu */}
      {showPfpMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#0B1E12] border border-[#22C55E] p-5 rounded-2xl w-64 shadow-2xl space-y-2 font-mono text-xs">
            <button
              onClick={() => {
                setShowPfpMenu(false);
                setShowPfpViewer(true);
              }}
              className="w-full text-left p-2.5 hover:bg-[#060907] rounded-xl text-zinc-200 transition-colors"
            >
              View Full Size
            </button>

            <label className="w-full block p-2.5 hover:bg-[#060907] rounded-xl text-[#39FF14] cursor-pointer transition-colors">
              Upload New Image
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePfpUpload}
              />
            </label>

            <button
              onClick={() => setShowPfpMenu(false)}
              className="w-full text-left p-2.5 hover:bg-[#060907] rounded-xl text-rose-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PFP Full Viewer */}
      {showPfpViewer && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowPfpViewer(false)}
        >
          <div
            className="bg-[#0B1E12] border border-[#22C55E] p-3 rounded-3xl max-w-lg w-full flex items-center justify-center overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={pfpSrc}
              className="max-h-[70vh] object-contain rounded-2xl"
              alt="Avatar Full"
            />
          </div>
        </div>
      )}

    </div>
  );
}