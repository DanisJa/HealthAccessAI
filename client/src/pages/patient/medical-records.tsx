import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, RefreshCw, FileText, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientMedicalRecords() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: medicalRecords, isLoading } = useQuery({
    queryKey: ['/api/patient/medical-records', tab, page, search],
  });

  const totalPages = 3; // This should come from API

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const viewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">My Medical Records</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search records..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button size="icon" variant="ghost">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="all" onValueChange={setTab}>
                <TabsList className="grid w-full md:w-auto grid-cols-3">
                  <TabsTrigger value="all">All Records</TabsTrigger>
                  <TabsTrigger value="reports">Medical Reports</TabsTrigger>
                  <TabsTrigger value="orders">Medical Orders</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="border rounded-md">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalRecords && medicalRecords.length > 0 ? (
                        medicalRecords.map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={record.doctor.avatarUrl} />
                                  <AvatarFallback>
                                    {getInitials(record.doctor.firstName, record.doctor.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">Dr. {`${record.doctor.firstName} ${record.doctor.lastName}`}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.type === 'report' ? 'default' : 'outline'}>
                                {record.type === 'report' ? 'Medical Report' : 'Medical Order'}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.title}</TableCell>
                            <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => viewRecord(record)}>
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No medical records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} />
                  </PaginationItem>
                  {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
                    <PaginationItem key={pageNum}>
                      <Button 
                        variant={pageNum === page ? "default" : "outline"} 
                        size="icon"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Record Dialog */}
      {selectedRecord && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedRecord.title}
                <span className="inline-block ml-2">
                  <Badge variant={selectedRecord.type === 'report' ? 'default' : 'outline'}>
                    {selectedRecord.type === 'report' ? 'Medical Report' : 'Medical Order'}
                  </Badge>
                </span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-6">
                <Avatar>
                  <AvatarImage src={selectedRecord.doctor.avatarUrl} />
                  <AvatarFallback>
                    {getInitials(selectedRecord.doctor.firstName, selectedRecord.doctor.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Dr. {`${selectedRecord.doctor.firstName} ${selectedRecord.doctor.lastName}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRecord.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-b py-4 my-4">
                <div className="prose max-w-none">
                  <p>{selectedRecord.content}</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ChatWidget role="patient" />
    </PageContainer>
  );
}
