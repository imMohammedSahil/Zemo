import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Dashboard() {

  const [url, setUrl] = useState("");
  const [products, setProducts] = useState([]);

  const [alertPrices, setAlertPrices] = useState({});
  const [alertTolerances, setAlertTolerances] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {

  try {

    const res = await API.get("/product");

    console.log("DEBUG PROFILE PRODUCTS:", res.data);

    setProducts([...res.data]);

  } catch (error) {
    console.error("PROFILE PRODUCT LOAD ERROR:", error);
  }

}
  async function handleTrack() {

    if (!url) return;

    try {

      await API.post("/product/add", {
        productUrl: url,
        source: url.includes("amazon") ? "amazon" : "flipkart"
      });

      alert("Product added for tracking!");

      setUrl("");

      loadProducts();

    } catch (error) {

      console.error(error);
      alert("Failed to add product");

    }

  }

  async function createAlert(productId) {

  const price = alertPrices[productId];

  const tolerance =
    alertTolerances[productId] ??
    products.find(p => p._id === productId)?.activeAlert?.tolerance ??
    0;

  console.log("DEBUG ALERT REQUEST:", {
    productId,
    price,
    tolerance
  });

  if (!price) {
    alert("Enter alert price");
    return;
  }

  try {

    await API.post("/alert/create", {
      productId,
      targetPrice: Number(price),
      tolerance: Number(tolerance)
    });

    alert("Price alert updated!");

    await loadProducts();

  } catch (error) {

    console.error(error);
    alert("Failed to create alert");

  }

}

async function removeProduct(productId) {

  const confirmDelete = confirm("Remove this product from tracking?");

  if (!confirmDelete) return;

  try {

    await API.delete(`/product/remove/${productId}`);

    alert("Product removed");

    loadProducts();

  } catch (error) {

    console.error(error);

    alert("Failed to remove product");

  }

}

  return (

    <div className="max-w-5xl mx-auto p-8">

      {/* Track Product */}

      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-8">

        <h2 className="text-xl font-semibold mb-4">
          Track a Product
        </h2>

        <div className="flex gap-4">

          <input
            type="text"
            placeholder="Paste Amazon / Flipkart product URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 outline-none"
          />

          <button
            onClick={handleTrack}
            className="bg-blue-500 px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Track
          </button>

        </div>

      </div>

      {/* Tracked Products */}

      <h2 className="text-xl font-semibold mb-4">
        Tracked Products
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {products.map((product) => (

          <div key={product._id}>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">

              {product.image && (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-40 object-contain mb-4"
                />
              )}

              <h3 className="text-lg font-semibold">
                {product.title}
              </h3>

              <p className="text-green-400 mt-2">
                Current Price: ₹{product.currentPrice ?? "--"}
              </p>

              <p className="text-yellow-400">
                Lowest Price: ₹{product.historicLow ?? "--"}
              </p>

              <p className="text-gray-400">
                Source: {product.source}
              </p>

              {/* Active Alert Display */}

             {product.activeAlert && (

  <div className="mt-3 bg-yellow-900/30 border border-yellow-600 text-yellow-300 text-sm p-3 rounded">

    <div className="font-semibold mb-1">🔔 Price Alert Active</div>
    

    <div>
      Target Price: ₹{product.activeAlert.targetPrice}
    </div>

    <div>
Tolerance: ₹{product.activeAlert?.tolerance ?? 0}
</div>

  </div>

)}

<button
  onClick={() => removeProduct(product._id)}
  className="mt-3 bg-red-500 px-3 py-2 rounded hover:bg-red-600"
>
  Remove Product
</button>

            </div>

            {/* Price Alert Creator */}

            <div className="mt-4 flex gap-2">

              <input
                type="number"
                placeholder="Alert price"
                className="w-28 p-2 rounded bg-gray-800 border border-gray-700"
                onChange={(e) =>
                  setAlertPrices({
                    ...alertPrices,
                    [product._id]: e.target.value
                  })
                }
              />

              <input
                type="number"
                placeholder="Tolerance"
                className="w-24 p-2 rounded bg-gray-800 border border-gray-700"
                onChange={(e) =>
                  setAlertTolerances({
                    ...alertTolerances,
                    [product._id]: e.target.value
                  })
                }
              />

              <button
                onClick={() => createAlert(product._id)}
                className="bg-yellow-500 px-3 rounded hover:bg-yellow-600"
              >
                Save
              </button>

            </div>

            {/* Navigation */}

            <div className="flex gap-4 mt-3 mb-6">

              <button
                onClick={() => navigate(`/product/${product._id}/graph`)}
                className="text-blue-400 hover:underline"
              >
                View Graph
              </button>

              <button
                onClick={() => navigate(`/product/${product._id}/insights`)}
                className="text-purple-400 hover:underline"
              >
                View AI Insights
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}