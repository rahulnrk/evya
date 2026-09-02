import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { 
  getReferralDetails,
  selectCurrentReferral,
  selectReferralStatus,
  selectReferralError
} from '@/store/reducers/referralCode/referralSlice';

export default function ReferralCodeInfo() {
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentReferral = useSelector(selectCurrentReferral);
  const status = useSelector(selectReferralStatus);
  const error = useSelector(selectReferralError);
 console.log(currentReferral);
  useEffect(() => {
    if (id) {
      dispatch(getReferralDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      navigate('/referral-codes');
    }
  }, [error, toast, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

 const getSiteNames = () => {
  if (!currentReferral) return "";

  if (currentReferral.allSites) return "All Sites";

  return currentReferral.sites
    ?.map(site => site.siteName)
    .filter(Boolean)
    .join(", ");
};

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  if (!currentReferral) {
    return <div className="p-4">No referral code found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="w-full max-w-4xl">
        <Button 
          type="button" 
          variant="outline" 
          className="mb-3"
          onClick={() => navigate('/referral-codes')}
        >
          Back
        </Button>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">Referral Code: {currentReferral.referralCode}</CardTitle>
            <Button 
              onClick={() => navigate(`/referral-codes/${id}/edit`)}
              variant="outline"
            >
              Edit Code
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Code Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <p className="text-sm">{currentReferral.referralCode}</p>
                </div>
                <div className="space-y-2">
                  <Label>Offer Percentage</Label>
                  <p className="text-sm">{currentReferral.offerPercentage}%</p>
                </div>
              </div>
            </div>
            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Validity Period</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <p className="text-sm">{formatDate(currentReferral.validFrom)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Valid To</Label>
                  <p className="text-sm">{formatDate(currentReferral.validTo)}</p>
                </div>
              </div>
            </div>
            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Site Application</h3>
              <div className="space-y-2">
                <Label>Applied to</Label>
                <p className="text-sm">{getSiteNames()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}