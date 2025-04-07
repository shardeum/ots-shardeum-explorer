import { FC } from "react";
import { NavLink } from "react-router-dom";

const GlobalHeader: FC = () => (
  <header className="bg-white border-b border-gray-200 shadow-sm">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Logo Section */}
        <div className="flex items-center">
          <NavLink to="/" className="flex items-center space-x-2">
            <img 
              src="/shardeum.png" 
              alt="Shardeum Logo" 
              className="h-16 w-auto"
            />
            <span className="text-xl font-semibold text-gray-900">
              Shardeum Testnet Explorer
            </span>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <nav className="hidden sm:flex items-center space-x-8">
          <NavLink 
            to="https://explorer-testnet.shardeum.org/" 
            className={({ isActive }) => 
              `text-sm font-medium transition-colors ${
                isActive 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-900"
              }`
            }
          >
            Shardeum Explorer
          </NavLink>
          <NavLink 
            to="https://careers.shardeum.org/" 
            className={({ isActive }) => 
              `text-sm font-medium transition-colors ${
                isActive 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-900"
              }`
            }
          >
            Careers
          </NavLink>
        </nav>
      </div>
    </div>
  </header>
);

export default GlobalHeader;