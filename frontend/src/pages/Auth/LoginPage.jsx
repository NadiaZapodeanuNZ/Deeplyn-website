import FormLogin from "../../components/forms/FormLogin.jsx";
import Image from "../../assets/Login/login.jpg";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,_#d44d8c,_#e15b83,_#eb6c7c,_#f17e77,_#f49076,_#f08d78,_#ec8a79,_#e8877b,_#d67180,_#be6085,_#9f5389,_#7a4a8a)]" />
      <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-white">
        <div className="hidden md:block relative md:w-1/2">
          <img src={Image} alt="" className="absolute inset-0 w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-[#9B3CC4]/20" />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8
                        bg-white rounded-3xl md:rounded-l-none md:rounded-r-3xl">
          <FormLogin />
        </div>

      </div>
    </div>
  );
}
