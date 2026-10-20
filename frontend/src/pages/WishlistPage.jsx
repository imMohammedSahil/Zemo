import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function WishlistPage() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [wishlistUrl, setWishlistUrl] = useState("");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [toast, setToast] = useState("");
  const [addingWishlist, setAddingWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  async function loadWishlist() {
    try {
      setLoading(true);
      const res = await API.get("/user/me");
      setWishlist(res.data.wishlist || []);
    } catch (err) {
      console.error("Wishlist load error:", err);
    } finally {
      setLoading(false);
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
      setShowAddPopup(false);
      showNotification("Product stored in wishlist queue");
      loadWishlist();
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
      showNotification("Promoted to Active Radar Surveillance!");
      loadWishlist();
    } catch (err) {
      console.error("Tracking error:", err);
      showNotification("Failed to initiate tracking");
    }
  }

  async function removeWishlistItem(productId) {
    try {
      await API.delete(`/user/wishlist/${productId}`);
      showNotification("Item removed from wishlist");
      loadWishlist();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-14 right-8 bg-[#0B1E12] border border-[#39FF14] text-[#f4ffe0] px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(57,255,20,0.3)] z-50 flex items-center gap-3 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping"></span>
          {toast}
        </div>
      )}

      {/* Header Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zemo-card border border-zemo-border text-zinc-400 hover:text-[#39FF14] hover:border-[#39FF14]/50 transition-all text-xs font-mono"
        >
          <span>←</span>
          <span>Return to Radar</span>
        </button>

        <button
          onClick={() => setShowAddPopup(true)}
          className="px-5 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32E612] text-black text-xs font-mono font-extrabold transition-all shadow-[0_0_18px_rgba(57,255,20,0.35)] flex items-center gap-2 cursor-pointer"
        >
          <span>+</span>
          <span>Add Product to Wishlist</span>
        </button>
      </div>

      {/* Main Wishlist Stage */}
      <div className="bg-zemo-card border border-zemo-border rounded-3xl p-6 sm:p-8 shadow-xl">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zemo-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight font-mono">
                Surveillance Wishlist Matrix
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Staged products waiting to be activated into live 15-minute background price surveillance.
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#0D3B16] border border-[#164E22] text-[#39FF14] font-bold">
            {wishlist.length} Staged Items
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-zinc-400">Loading wishlist matrix...</span>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#060907] border border-zemo-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-base font-mono text-white font-bold">Your Wishlist Matrix is Empty</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-6">
              Stage products from Amazon here to deploy them into active price monitoring whenever you are ready.
            </p>
            <button
              onClick={() => setShowAddPopup(true)}
              className="px-6 py-2.5 rounded-xl bg-[#0D3B16] border border-[#22C55E]/40 text-[#39FF14] hover:bg-[#39FF14] hover:text-black text-xs font-mono font-bold transition-all"
            >
              + Stage First Product
            </button>
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
                    className="px-3 py-1.5 rounded-lg bg-[#0D3B16] border border-[#22C55E]/40 hover:bg-[#39FF14] hover:text-black text-[#39FF14] font-mono text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer"
                  >
                    Track
                  </button>

                  <button
                    onClick={() => removeWishlistItem(item._id)}
                    className="px-3 py-1 rounded-lg text-zinc-500 hover:text-red-400 font-mono text-[10px] transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add Wishlist Item Modal */}
      {showAddPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#0B1E12] border border-[#22C55E] p-6 rounded-3xl max-w-md w-full shadow-[0_0_40px_rgba(57,255,20,0.25)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-mono">
                Stage Product in Wishlist
              </h3>
              <button
                onClick={() => setShowAddPopup(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Paste an Amazon product link. Zemo will fetch product details and save it to your wishlist queue.
            </p>

            <input
              value={wishlistUrl}
              onChange={(e) => setWishlistUrl(e.target.value)}
              placeholder="Paste Amazon product URL..."
              className="w-full p-3.5 bg-[#060907] border border-[#163E22] focus:border-[#39FF14] text-white rounded-xl text-xs font-mono outline-none shadow-inner"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={addWishlistItem}
                disabled={addingWishlist}
                className="flex-1 bg-[#39FF14] hover:bg-[#32E612] text-black font-mono font-bold text-xs py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(57,255,20,0.3)]"
              >
                {addingWishlist ? "Extracting Metadata..." : "Stage in Wishlist"}
              </button>

              <button
                onClick={() => setShowAddPopup(false)}
                className="px-4 bg-zemo-card border border-zemo-border text-zinc-400 hover:text-white font-mono text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
