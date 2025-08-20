import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/components/AuthProvider";
import { FaUser } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

export default function NameSelection() {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { createUserProfile } = useAuthContext();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    try {
      await createUserProfile(displayName.trim());
      toast({
        title: "Success",
        description: "Profile created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
            <p className="text-gray-600 mt-1">Please choose your display name</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 mb-2">
                Display Name
              </Label>
              <Input
                type="text"
                id="displayName"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="mt-2"
                data-testid="input-display-name"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !displayName.trim()}
              data-testid="button-continue"
            >
              {loading ? "Creating Profile..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
