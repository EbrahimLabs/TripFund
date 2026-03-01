import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gradient-hero mesh-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-18 h-18 rounded-2xl gradient-primary glow-primary mb-3 p-4"
        >
          <Wallet className="h-8 w-8 text-primary-foreground" />
        </motion.div>
        <h1 className="text-6xl font-display font-bold gradient-text">404</h1>
        <p className="text-lg font-display font-medium text-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold gradient-primary glow-primary text-primary-foreground rounded-xl border-0 transition-opacity hover:opacity-90"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
