import { useState, useEffect } from "react";
import API from "../services/api";

export default function NotificationBell() {

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  async function loadNotifications() {

    try {

      const res = await API.get("/notifications");

      setNotifications(res.data);

    } catch (err) {

      console.error(err);

    }

  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return (

    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="text-xl"
      >
        🔔
      </button>

      {open && (

        <div className="absolute right-0 mt-3 w-72 bg-gray-900 border border-gray-800 rounded-lg shadow-lg">

          <div className="p-3 border-b border-gray-800 font-semibold">
            Price Alerts
          </div>

          {notifications.length === 0 && (
            <div className="p-3 text-gray-400">
              No alerts yet
            </div>
          )}

          {notifications.map((n, i) => (

            <div
              key={i}
              className="p-3 border-b border-gray-800 text-sm"
            >
              {n.productTitle} dropped to ₹{n.newPrice}
            </div>

          ))}

        </div>

      )}

    </div>

  );

}