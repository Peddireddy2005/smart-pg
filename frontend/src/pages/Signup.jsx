import { useState } from "react";
import { signupUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

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
      await signupUser({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      alert("Account created successfully");

      navigate("/login");
    } catch (error) {
      console.log(error.response?.data);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Signup failed"
      );
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <div className="flex gap-2">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="px-3 border rounded"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <select
          name="role"
          value={formData.role}
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