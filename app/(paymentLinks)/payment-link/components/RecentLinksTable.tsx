import { PaymentLink } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentLinksTableProps {
  recentLinks: PaymentLink[];
  isLoading: boolean;
}

export const RecentLinksTable: React.FC<RecentLinksTableProps> = ({
  recentLinks,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="mt-8 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center space-x-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentLinks.length === 0) {
    return (
      <Card className="mt-8 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-200">Recent Payment Links</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-400 py-8">No recent payment links found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-slate-200">Recent Payment Links</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
              <TableHead className="text-slate-400">Created</TableHead>
              <TableHead className="text-slate-400">Amount</TableHead>
              <TableHead className="text-slate-400">Description</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentLinks.map((link) => (
              <TableRow key={link.id} className="border-slate-800 hover:bg-slate-800/50">
                <TableCell className="font-medium text-slate-300">{link.createdAt}</TableCell>
                <TableCell className="text-slate-300">{link.amount} {link.currency}</TableCell>
                <TableCell className="text-slate-400 max-w-xs truncate">{link.description || '-'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={link.status === 'active' ? 'default' : link.status === 'expired' ? 'destructive' : 'secondary'}
                  >
                    {link.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300">{link.expiresAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};