

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";

export default function RegisterForm() {
  const navigate = useNavigate()
  // i will use navigate function to go to a different path , 
  //or maybe somewhere else


  // here is the state of the form
  // at first, username is '', email is '' , etc
  //meaning that is empty
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_pass: ''
  })

  // in intitial state, the error is empty ('')
  //but then , when an error occurs, setError sets the actual error
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  //here we get the input from the user
  // username = Andrew --> e.target.name = username and target.value =Andrew
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')

  // Validarea client-side: verificam ca toate campurile sunt completate
  // si ca parolele coincid INAINTE sa facem apelul catre backend.
  // Asta economiseste un apel inutil de retea pentru erori evidente.
  if (!form.username || !form.email || !form.password || !form.confirm_pass) {
    setError('All fields are required.')
    return
  }

  if (form.password !== form.confirm_pass) {
    setError('Passwords do not match.')
    return
  }

  setLoading(true)

  try {
      const data = await registerUser(form)
        localStorage.setItem('pending_email', data.email)
        navigate('/verify-email')
      } 
  catch (err) 
  {
      if (err.response && err.response.data) 
      {
        const errorData = err.response.data
        const firstError = Object.values(errorData)[0]
        setError(Array.isArray(firstError) ? firstError[0] : firstError)
      } 
      else 

      {
      setError('Something went wrong. Please try again.')
      }
  } 
  finally 
  {
    setLoading(false)
  }
}
  // Helper: ce tip de input e fiecare camp
  const getInputType = (field) => {
    if (field === 'email') return 'email'
    if (field === 'password' || field === 'confirm_pass') return 'password'
    return 'text'
  }

  // Helper: placeholder pentru fiecare camp
  const getPlaceholder = (field) => {
    const placeholders = 
    {
      username:'Username',
      email:'Email',
      password:'Password',
      confirm_pass:'Confirm Password',
    }
    return placeholders[field]
  }

  return (
    <div className="bg-white min-w-2/5 max-w-sm lg:max-w-lg md:max-w-md rounded-2xl shadow-lg p-6 sm:p-10 sm:ml-5 sm:mr-5 lg:p-12">

      <h1 className="text-[clamp(1rem,2.3vw,7.5rem)] font-bold text-[#2D1B69] text-center sm:whitespace-nowrap">
        Welcome to{" "}
        <Link
          to="/"
          className="inline-block font-semibold text-transparent bg-clip-text 
                    bg-[linear-gradient(90deg,#8D57CB_0%,#943CE7_28%,#A826DE_53%,#C228B2_68%,#CC23A2_80%,#DA108B_100%)]
                    hover:opacity-80 transition-opacity duration-200 cursor-pointer"
        >
          Deeplyn
        </Link>
      </h1>

      <p className="mb-6 text-center text-[#9022d4] text-[clamp(0.6rem,1.3vw,6.875rem)]">
        Start your mental health journey
      </p>

      {/* Error message */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-2 sm:space-y-4" onSubmit={handleSubmit}>
        {["username", "email", "password", "confirm_pass"].map((field) => (
          <input
            key={field}
            name={field}
            value={form[field]}
            onChange={handleChange}
            type={getInputType(field)}
            placeholder={getPlaceholder(field)}
            className="w-full px-2 py-2 rounded-lg bg-white border border-gray-300
                       text-[clamp(0.5rem,1vw,1.1rem)] text-gray-900
                       placeholder:text-[clamp(0.7rem,0.9vw,1rem)] placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        ))}

        <button
          type="submit"
          disabled={loading}
          className="block w-full py-3 text-center rounded-lg bg-purple-600 hover:bg-[#6110b3]
                    disabled:opacity-50 text-white font-medium text-[clamp(0.8rem,1vw,1.1rem)] transition"
        >
          {loading ? 'Creating account...' : 'Create an account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-purple-600 hover:underline">
          Sign in
        </Link>
      </p>

    </div>
  )
}