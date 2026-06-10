import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import PaymentUi from "./paymentUi";

export default function App() {

  return (

    <Routes>

      <Route
        path="/"
        element={
          <Navigate to="/payment/1" />
        }
      />

      <Route
        path="/payment/:id"
        element={<PaymentUi />}
      />

    </Routes>

  );
}
