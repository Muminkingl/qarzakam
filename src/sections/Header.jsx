import { Link as LinkScroll } from "react-scroll";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useLanguage } from "../constants/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import Button from "../components/Button.jsx";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import AuthModal from "../components/AuthModal";

const Header = () => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 32);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const NavLink = ({ id, label }) => (
    <LinkScroll
      onClick={() => setIsOpen(false)}
      to={id}
      offset={-100}
      spy
      smooth
      activeClass="nav-active"
      className="base-bold text-p4 uppercase transition-colors duration-500 cursor-pointer hover:text-p1 max-lg:my-4 max-lg:h5"
    >
      {t(label)}
    </LinkScroll>
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 z-50 w-full py-10 transition-all duration-500 max-lg:py-4",
        hasScrolled && "py-2 bg-black-100 backdrop-blur-[8px]",
      )}
    >
      <div className="container flex h-14 items-center justify-between max-lg:px-5">
        <a className="lg:hidden flex-1 cursor-pointer z-2">
          <img src="/images/xora.svg" width={115} height={55} alt="logo" />
        </a>

        <div
          className={clsx(
            "flex-1 max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:w-full max-lg:bg-s2 max-lg:opacity-0",
            isOpen ? "max-lg:opacity-100" : "max-lg:pointer-events-none",
          )}
        >
          <div className="max-lg:relative max-lg:flex max-lg:flex-col max-lg:min-h-screen max-lg:p-6 max-lg:overflow-hidden sidebar-before max-md:px-4">
            <nav className="max-lg:relative max-lg:z-2 max-lg:my-auto">
              <ul className="flex max-lg:block max-lg:px-12">
                <li className="nav-li">
                  <NavLink id="features" label="features" />
                  <div className="dot" />
                  <NavLink id="pricing" label="pricing" />
                </li>

                <li className="nav-logo px-8">
                  <LinkScroll
                    to="hero"
                    offset={-250}
                    spy
                    smooth
                    className={clsx(
                      "max-lg:hidden transition-transform duration-500 cursor-pointer",
                    )}
                  >
                    <img
                      src="/images/xora.svg"
                      width={160}
                      height={55}
                      alt="logo"
                    />
                  </LinkScroll>
                </li>

                <li className="nav-li">
                  <NavLink id="faq" label="faq" />
                </li>
              </ul>
            </nav>

           

            <div className="lg:hidden block absolute top-1/2 left-0 w-[960px] h-[380px] translate-x-[-290px] -translate-y-1/2 rotate-90">
              <img
                src="/images/bg-outlines.svg"
                width={960}
                height={380}
                alt="outline"
                className="relative z-2"
              />
              <img
                src="/images/bg-outlines-fill.png"
                width={960}
                height={380}
                alt="outline"
                className="absolute inset-0 mix-blend-soft-light opacity-5"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Language selector */}
          <div className="border-2 border-s4/25 hover:border-s4 rounded-full p-2 transition-colors">
            <LanguageSelector />
          </div>
          
          {isLoaded && (
            user ? (
              <div className="relative group">
                <button 
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-s4/25 hover:border-s4 transition-colors"
                  onClick={() => navigate('/dashboard')}
                >
                  <img 
                    src={user.imageUrl || '/images/default-avatar.png'} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-p4 max-lg:hidden">
                    {user.firstName || 'User'}
                  </span>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 py-2 bg-s2 rounded-xl border border-s4/25 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full text-left px-4 py-2 text-p4 hover:bg-s4/10 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-p4 hover:bg-s4/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Button
                // Removed max-lg:hidden to ensure the button is always visible
                onClick={() => setIsAuthModalOpen(true)}
                markerFill="#2EF2FF"
                className="hidden lg:block" // Show only on desktop, as we now have a mobile version in the sidebar
              >
                <span className="relative flex items-center min-h-[40px] px-6 py-2 rounded-full inner-before group-hover:before:opacity-100 overflow-hidden">
                  <span className="relative z-2 font-poppins base-bold text-p1 uppercase">
                    {t("login")}
                  </span>
                </span>
              </Button>
            )
          )}
          
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
          />
          
          <button
            className="lg:hidden z-2 size-10 border-2 border-s4/25 rounded-full flex justify-center items-center ml-4"
            onClick={() => setIsOpen((prevState) => !prevState)}
          >
            <img
              src={`/images/${isOpen ? "close" : "magic"}.svg`}
              alt="magic"
              className="size-1/2 object-contain"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;