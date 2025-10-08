import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CreateInterview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [timing, setTiming] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    type: "personal",
    experience_level: "",
    topic: "",
    issue: "",
    duration_minutes: 30,
  });
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const getPriceForDuration = (minutes: number) => {
    const priceMap: Record<number, number> = {
      5: 0,
      15: 2000,
      30: 4000,
      45: 6000,
      60: 8000,
    };
    return priceMap[minutes] || 4000;
  };

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: { action: 'verify', reference }
      });

      if (error) throw error;

      if (data?.status && data.data?.status === 'success') {
        setPaymentReference(reference);
        setPaymentVerified(true);
        toast.success('Payment verified successfully!');
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const amount = getPriceForDuration(formData.duration_minutes);
      
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: { 
          action: 'initialize',
          email: user.email,
          amount: amount
        }
      });

      if (error) throw error;

      if (data?.status && data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.experience_level || !formData.topic) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Skip payment for 5-minute free interviews
    if (formData.duration_minutes === 5) {
      setPaymentVerified(true);
    } else if (!paymentVerified) {
      await initiatePayment();
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { data, error } = await supabase
        .from('interviews')
        .insert([
          {
            ...formData,
            creator_id: user.id,
            scheduled_time: timing === "later" && scheduledDate ? scheduledDate.toISOString() : null,
            status: 'scheduled',
            payment_status: formData.duration_minutes === 5 ? 'free' : 'paid',
            payment_reference: paymentReference,
            amount_paid: getPriceForDuration(formData.duration_minutes),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Interview created successfully!");
      navigate(`/interview/${data.id}`);
    } catch (error) {
      console.error('Error creating interview:', error);
      toast.error("Failed to create interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-6">Create New Interview</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Interview Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Frontend Developer Interview"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Timing */}
          <div className="space-y-2">
            <Label>When would you like to conduct this interview? *</Label>
            <RadioGroup value={timing} onValueChange={(v) => setTiming(v as "now" | "later")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="cursor-pointer">Start Now</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="later" id="later" />
                <Label htmlFor="later" className="cursor-pointer">Schedule for Later</Label>
              </div>
            </RadioGroup>
          </div>

          {timing === "later" && (
            <div className="space-y-2">
              <Label>Select Date and Time *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Type */}
          <div className="space-y-2">
            <Label>Interview Type *</Label>
            <RadioGroup value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personal" id="personal" />
                <Label htmlFor="personal" className="cursor-pointer">Personal (1-on-1 with AI)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group" className="cursor-pointer">Group (Multiple participants + AI)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level *</Label>
            <Select value={formData.experience_level} onValueChange={(v) => setFormData({ ...formData, experience_level: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                <SelectItem value="lead">Lead/Principal (8+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Interview Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g., React, System Design, Behavioral Questions"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
            />
          </div>

          {/* Issue/Focus Area */}
          <div className="space-y-2">
            <Label htmlFor="issue">Specific Focus Area (Optional)</Label>
            <Textarea
              id="issue"
              placeholder="Any specific areas you'd like to focus on or improve?"
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Select 
              value={formData.duration_minutes.toString()} 
              onValueChange={(v) => setFormData({ ...formData, duration_minutes: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes - Free</SelectItem>
                <SelectItem value="15">15 minutes - ₦2,000</SelectItem>
                <SelectItem value="30">30 minutes - ₦4,000</SelectItem>
                <SelectItem value="45">45 minutes - ₦6,000</SelectItem>
                <SelectItem value="60">60 minutes - ₦8,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          {paymentVerified && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">✓ Payment verified - ₦{getPriceForDuration(formData.duration_minutes).toLocaleString()}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Processing..." : paymentVerified ? "Create & Join Interview" : "Proceed to Payment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}