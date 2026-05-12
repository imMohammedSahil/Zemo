
import { useState, useEffect } from "react";
import API from "../services/api";

export default function ProfilePage() {

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

  const [stats, setStats] = useState({
    tracked: 0,
    monitoring: 0,
    alerts: 0
  });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  async function loadProfile() {

    try {

      const res = await API.get("/user/me");

      setProfile({
        fullName: res.data.name,
        username: res.data.username || "demo",
        email: res.data.email,
        location: res.data.location || "",
        pfp: res.data.profilePicture || "https://i.pravatar.cc/150"
      });

      setEditFullName(res.data.name); 
setEditLocation(res.data.location || "");

      console.log("Wishlist from backend:", res.data.wishlist);
setWishlist(res.data.wishlist || []);

console.log("PROFILE RESPONSE:", res.data);

    } catch (err) {

      console.error("Profile load error:", err);

    }

  }

  async function loadStats() {

    setStats({
      tracked: 0,
      monitoring: 0,
      alerts: 0
    });

  }

  async function addWishlistItem() {

    if (!wishlistUrl) return;

    try {

      const source =
        wishlistUrl.includes("amazon")
          ? "amazon"
          : wishlistUrl.includes("flipkart")
          ? "flipkart"
          : null;

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

      loadProfile();

    } catch (err) {

      console.error("Wishlist metadata error:", err);

    }

  }

  async function startTracking(item) {

    try {

      if (!item || !item.productUrl) {
        console.error("Invalid wishlist item:", item);
        return;
      }

      const source =
        item.productUrl.includes("amazon") ? "amazon" : "flipkart";

      await API.post("/product/add", {
        productUrl: item.productUrl,
        source
      });

      await API.delete(`/user/wishlist/${item._id}`);

      setToast("✔ Product moved to tracking");

      setTimeout(() => setToast(""), 2000);

      loadProfile();

    } catch (err) {

      console.error("Tracking error:", err);

    }

  }

  async function removeWishlistItem(productId) {

    try {

      await API.delete(`/user/wishlist/${productId}`);

      loadProfile();

    } catch (err) {

      console.error(err);

    }

  }

  async function saveProfile() {

  try {

    console.log("SENDING PROFILE UPDATE:", {
  name: editFullName,
  location: editLocation,
  email: profile.email
});

await API.put("/user/update-profile", {
  name: editFullName,
  location: editLocation,
  email: profile.email
});

    // UPDATE UI STATE IMMEDIATELY
    setProfile(prev => ({
      ...prev,
      fullName: editFullName,
      location: editLocation
    }));

    setShowEditPopup(false);

    setToast("✔ Profile updated");

    setTimeout(() => setToast(""), 2000);

  } catch (err) {

    console.error("Profile update error:", err);

  }

}

async function handlePfpUpload(e) {

  const file = e.target.files[0];

  console.log("SELECTED FILE:", file);

  if (!file) return;

  const formData = new FormData();
  formData.append("pfp", file);
  formData.append("email", profile.email);

  console.log("SENDING FORM DATA:", profile.email);

  try {

    const res = await API.post("/user/upload-pfp", formData);

    console.log("UPLOAD RESPONSE:", res.data);

    setProfile(prev => ({
      ...prev,
      pfp: res.data.profilePicture
    }));

    setShowPfpMenu(false);

  } catch (err) {

    console.error("PFP upload error:", err);

  }

}



  if (!profile) return <div className="p-8">Loading profile...</div>;

  return (

    <>

      {toast && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto p-8">

        {/* PROFILE HEADER */}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">

          <div className="flex items-center gap-6">

           <img
  src={
    profile.pfp && profile.pfp.startsWith("http")
      ? profile.pfp
      : `http://localhost:5000/${profile.pfp}`
  }
  alt="pfp"
  onClick={() => setShowPfpMenu(true)}
  className="w-20 h-20 rounded-full object-cover cursor-pointer hover:opacity-80"
/>

            <div>
             <h2 className="text-xl font-semibold">
  @{profile.username}
</h2>

<p className="text-gray-300">
  {profile.fullName}
</p>

<div className="mt-2">

  <p className="text-gray-400 text-sm">
    {profile.email}
  </p>

  <p className="text-gray-500 text-sm">
    📍 {profile.location || "Location not set"}
  </p>

</div>

              <button
    onClick={() => setShowEditPopup(true)}
    className="mt-2 bg-blue-500 px-3 py-1 rounded text-sm"
  >
    Edit Profile
  </button>
            </div>

          </div>

        </div>


        {/* WISHLIST */}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">

          <div className="flex justify-between mb-4">

            <h3 className="text-lg font-semibold">Wishlist</h3>

            <button
              onClick={() => setShowWishlistPopup(true)}
              className="bg-purple-500 px-3 py-1 rounded"
            >
              + Add Product
            </button>

          </div>

          {wishlist.map((item, index) => (

            <div
              key={item._id ? item._id.toString() : index}
              className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 mb-3"
            >

              <img
                src={
                  item.image && item.image.trim().length > 0
                    ? item.image
                    : "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"
                }
                className="w-16 h-16 object-contain"
                alt="product"
              />

              <div className="flex-1">

                <p className="text-sm font-semibold">
                  {item.title && item.title.trim().length > 0
                    ? item.title
                    : "Unknown Product"}
                </p>

                <p className="text-xs text-gray-400">
                  {item.source || "unknown"}
                </p>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={() => startTracking(item)}
                  className="bg-blue-500 px-3 py-1 rounded text-sm"
                >
                  Start Tracking
                </button>

                <button
                  onClick={() => removeWishlistItem(item._id)}
                  className="bg-red-500 px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>


      {/* ADD PRODUCT POPUP */}

      {showWishlistPopup && (

        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">

          <div className="bg-gray-900 p-6 rounded-lg w-96">

            <h3 className="mb-4 text-lg font-semibold">
              Add Product to Wishlist
            </h3>

            <input
              value={wishlistUrl}
              onChange={(e) => setWishlistUrl(e.target.value)}
              placeholder="Paste Amazon / Flipkart URL"
              className="w-full p-2 bg-gray-800 rounded mb-4"
            />

            <div className="flex gap-3">

              <button
                onClick={addWishlistItem}
                className="bg-blue-500 px-4 py-2 rounded"
              >
                Add
              </button>

              <button
                onClick={() => setShowWishlistPopup(false)}
                className="bg-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

   {showEditPopup && (

  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">

    <div className="bg-gray-900 p-6 rounded-lg w-96">

      <h3 className="text-lg font-semibold mb-4">
        Edit Profile
      </h3>

      {/* USERNAME (READ ONLY) */}

      <input
        value={`@${profile.username}`}
        disabled
        className="w-full p-2 bg-gray-700 text-gray-400 rounded mb-3 cursor-not-allowed"
      />

      {/* FULL NAME */}

      <input
        value={editFullName}
        onChange={(e) => setEditFullName(e.target.value)}
        placeholder="Full Name"
        className="w-full p-2 bg-gray-800 text-white rounded mb-3"
      />

      {/* EMAIL (READ ONLY) */}

      <input
        value={profile.email}
        disabled
        className="w-full p-2 bg-gray-700 text-gray-400 rounded mb-3 cursor-not-allowed"
      />

      {/* LOCATION */}

      <input
        value={editLocation}
        onChange={(e) => setEditLocation(e.target.value)}
        placeholder="Location"
        className="w-full p-2 bg-gray-800 text-white rounded mb-4"
      />

      <div className="flex gap-3">

        <button
          onClick={saveProfile}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Save
        </button>

        <button
          onClick={() => setShowEditPopup(false)}
          className="bg-gray-700 px-4 py-2 rounded"
        >
          Cancel
        </button>

      </div>

    </div>

  </div>

)}

{showPfpMenu && (

  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

    <div className="bg-gray-900 p-4 rounded-lg w-64">

      <button
        onClick={() => {
          setShowPfpMenu(false);
          setShowPfpViewer(true);
        }}
        className="w-full text-left p-2 hover:bg-gray-800 rounded"
      >
        View Photo
      </button>

      <label className="w-full block p-2 hover:bg-gray-800 rounded cursor-pointer">
        Upload New Photo
        <input
          type="file"
          className="hidden"
          onChange={handlePfpUpload}
        />
      </label>

      <button
        onClick={() => setShowPfpMenu(false)}
        className="w-full text-left p-2 hover:bg-gray-800 rounded text-red-400"
      >
        Cancel
      </button>

    </div>

  </div>

)}


{showPfpViewer && (

  <div
    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    onClick={() => setShowPfpViewer(false)}
  >

    <div
      className="bg-gray-900 p-4 rounded-xl w-[60%] max-w-3xl flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >

      <img
        src={
          profile.pfp && profile.pfp.startsWith("http")
            ? profile.pfp
            : `http://localhost:5000/${profile.pfp}`
        }
        className="max-h-[70vh] object-contain rounded-lg"
      />

    </div>

  </div>

)}

    </>

  );

}