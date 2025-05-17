import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Business {
  id: string;
  name: string;
  description: string;
  logo?: string;
}

const BusinessList = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setIsLoading(true);
        // Fetch real data from the backend API
        // Use a relative URL that will be routed through Nginx proxy
        const response = await fetch('/api/business');
        console.log('Fetching businesses from backend...');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched business data:', data);
        
        setBusinesses(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching businesses:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load businesses. Please try again later."
        });
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, []); // Empty dependency array so it only runs once on component mount

  const handleCreateBusiness = () => {
    // In a real app, this would navigate to a business creation form
    toast({
      title: "Coming Soon",
      description: "Business creation functionality is under development."
    });
  };

  const handleSelectBusiness = (businessId: string) => {
    // In a real app, this would navigate to the business dashboard
    navigate(`/dashboard?business=${businessId}`);
  };

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Businesses</h1>
          <p className="text-gray-600">Select a business to manage or create a new one</p>
        </div>
        <Button onClick={handleCreateBusiness} className="mt-4 md:mt-0">
          Create New Business
        </Button>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search businesses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{business.name}</CardTitle>
                <CardDescription>{business.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {business.logo && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={business.logo}
                      alt={`${business.name} logo`}
                      className="h-24 w-auto object-contain"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSelectBusiness(business.id)}
                  className="w-full"
                >
                  Select Business
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No businesses found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? "No businesses match your search criteria"
              : "You haven't created any businesses yet"}
          </p>
          <Button onClick={handleCreateBusiness}>Create Your First Business</Button>
        </div>
      )}
    </div>
  );
};

export default BusinessList;
