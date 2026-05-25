import { useState } from "react";
import { signupUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "resident",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signupUser(formData);

      alert("Account created successfully");

      navigate("/login");
    } catch (error) {
      console.log("Signup Error:", error.response?.data);
      console.log(error);

      alert(
      error.response?.data?.message ||
      error.message ||
      "Signup failed");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <select
          name="role"
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="resident">Resident</option>
          <option value="owner">Owner</option>
        </select>

        <button
          type="submit"
          className="bg-black text-white p-2 rounded"
        >
          Signup
        </button>
      </form>
    </div>
  );
}

export default Signup;