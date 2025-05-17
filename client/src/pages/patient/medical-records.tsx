import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/../utils/supabaseClient";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, RefreshCw, Eye, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { format } from "date-fns";

const PAGE_SIZE = 5;

type Report = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  doctor: {
    id: string;
    first_name: string;
    last_name: string;
  };
};

type FetchResult = {
  data: Report[];
  count: number;
};

async function fetchReports({
  queryKey,
}: {
  queryKey: [string, "all" | "reports", number, string, string];
}): Promise<FetchResult> {
  const [, _tab, page, search, userId] = queryKey;
  const { data, count, error } = await supabase
    .from("medical_reports")
    .select(
      `
      id,
      title,
      content,
      created_at,
      doctor:users!medical_reports_doctor_id_fkey (
        id,
        first_name,
        last_name
      )
    `,
      { count: "exact" }
    )
    .eq("patient_id", userId)
    .ilike("title", `%${search}%`)
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export default function PatientMedicalRecords() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"all" | "reports">("all");
  const [selected, setSelected] = useState<Report | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { data: result = { data: [], count: 0 }, isLoading } =
    useQuery<FetchResult>({
      queryKey: ["patient_reports", tab, page, search, user?.id ?? ""],
      queryFn: fetchReports,
      enabled: !!user,
      keepPreviousData: true,
    });

  const reports = result.data;
  const totalPages = Math.max(1, Math.ceil(result.count / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, tab]);

  const getInitials = (f: string, l: string) =>
    `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();

  const viewRecord = (r: Report) => {
    setSelected(r);
    setViewOpen(true);
  };

  const downloadPdf = (r: Report) => {
    try {
      // Initialize PDF document with single page format
      const doc = new jsPDF({
        unit: "pt",
        format: "letter",
      });

      // PDF styling constants - enhanced for better aesthetics
      const PDF_STYLES = {
        colors: {
          primaryDark: [41, 128, 185], // Professional blue
          primaryLight: [52, 152, 219], // Lighter blue for gradients
          accentColor: [46, 204, 113], // Medical green for accents
          headerBackground: [41, 128, 185], // Professional blue
          headerText: [255, 255, 255],
          bodyText: [44, 62, 80], // Dark slate for better readability
          infoText: [52, 73, 94], // Slightly lighter than body text
          mutedText: [127, 140, 141], // Subtle gray for less important text
          footerText: [127, 140, 141],
          lineColor: [189, 195, 199], // Subtle line color
          backgroundAccent: [236, 240, 241], // Very light gray for backgrounds
        },
        fonts: {
          header: { name: "helvetica", style: "bold", size: 18 },
          subheader: { name: "helvetica", style: "bold", size: 14 },
          info: { name: "helvetica", style: "normal", size: 10 },
          body: { name: "helvetica", style: "normal", size: 11 },
          footer: { name: "helvetica", style: "normal", size: 9 },
        },
        margins: {
          left: 50,
          right: 50,
          top: 70,
          bottom: 50,
        },
        spacing: {
          lineHeight: 14,
          afterHeader: 20,
          afterLine: 20,
          paragraph: 10,
        },
        radius: 3, // For rounded corners
      };

      // Calculate usable dimensions
      const { left, right } = PDF_STYLES.margins;
      const usableWidth = doc.internal.pageSize.width - left - right;
      let yPosition = PDF_STYLES.margins.top;
      const { colors, fonts, spacing } = PDF_STYLES;

      // Add decorative background elements
      // Light background for the whole page
      doc.setFillColor(250, 250, 250);
      doc.rect(
        0,
        0,
        doc.internal.pageSize.width,
        doc.internal.pageSize.height,
        "F"
      );

      // Subtle top accent bar
      doc.setFillColor(...colors.backgroundAccent);
      doc.rect(0, 0, doc.internal.pageSize.width, 15, "F");

      // Subtle bottom accent bar
      doc.setFillColor(...colors.backgroundAccent);
      doc.rect(
        0,
        doc.internal.pageSize.height - 15,
        doc.internal.pageSize.width,
        15,
        "F"
      );

      // Add header with gradient effect (simulated with multiple rectangles)
      const headerHeight = 60;
      const gradientSteps = 20;
      const stepHeight = headerHeight / gradientSteps;

      for (let i = 0; i < gradientSteps; i++) {
        // Calculate gradient color between primaryDark and primaryLight
        const ratio = i / gradientSteps;
        const r = Math.floor(
          colors.primaryDark[0] * (1 - ratio) + colors.primaryLight[0] * ratio
        );
        const g = Math.floor(
          colors.primaryDark[1] * (1 - ratio) + colors.primaryLight[1] * ratio
        );
        const b = Math.floor(
          colors.primaryDark[2] * (1 - ratio) + colors.primaryLight[2] * ratio
        );

        doc.setFillColor(r, g, b);
        doc.rect(
          0,
          i * stepHeight,
          doc.internal.pageSize.width,
          stepHeight + 1,
          "F"
        );
      }

      // Add title text with shadow effect (simulated with multiple slightly offset text)
      doc.setFont(fonts.header.name, fonts.header.style);
      doc.setFontSize(fonts.header.size);

      // Shadow effect (very subtle)
      doc.setTextColor(30, 30, 30, 0.3);
      doc.text(r.title, doc.internal.pageSize.width / 2, 38, {
        align: "center",
      });

      // Main title
      doc.setTextColor(...colors.headerText);
      doc.text(r.title, doc.internal.pageSize.width / 2, 36, {
        align: "center",
      });

      // Add decorative line under header
      yPosition = headerHeight + 20;
      doc.setDrawColor(...colors.accentColor);
      doc.setLineWidth(2);
      doc.line(left, yPosition, doc.internal.pageSize.width - right, yPosition);
      yPosition += spacing.afterLine;

      // Add doctor and date info with improved styling
      doc.setFont(fonts.subheader.name, fonts.subheader.style);
      doc.setFontSize(fonts.subheader.size);
      doc.setTextColor(...colors.primaryDark);
      doc.text(`Medical Report`, left, yPosition);
      yPosition += spacing.paragraph + 5;

      // Doctor info with icon simulation
      doc.setFont(fonts.info.name, "bold");
      doc.setFontSize(fonts.info.size);
      doc.setTextColor(...colors.infoText);
      doc.text(`Physician:`, left, yPosition);

      doc.setFont(fonts.info.name, "normal");
      doc.text(
        `Dr. ${r.doctor.first_name} ${r.doctor.last_name}`,
        left + 70,
        yPosition
      );
      yPosition += spacing.paragraph;

      // Date with icon simulation
      doc.setFont(fonts.info.name, "bold");
      doc.text(`Date:`, left, yPosition);

      doc.setFont(fonts.info.name, "normal");
      doc.text(
        format(new Date(r.created_at), "MMMM d, yyyy"),
        left + 70,
        yPosition
      );
      yPosition += spacing.paragraph;

      // Record ID with icon simulation
      doc.setFont(fonts.info.name, "bold");
      doc.text(`Record ID:`, left, yPosition);

      doc.setFont(fonts.info.name, "normal");
      doc.text(`#${r.id}`, left + 70, yPosition);
      yPosition += spacing.paragraph * 2;

      // Add content section header
      doc.setDrawColor(...colors.lineColor);
      doc.setLineWidth(0.5);
      doc.line(left, yPosition, doc.internal.pageSize.width - right, yPosition);
      yPosition += 15;

      doc.setFont(fonts.subheader.name, fonts.subheader.style);
      doc.setFontSize(fonts.subheader.size);
      doc.setTextColor(...colors.primaryDark);
      doc.text("Report Details", left, yPosition);
      yPosition += spacing.paragraph + 10;

      // Add content body with styled background
      // Add a light background for the content area
      const contentStartY = yPosition;

      // Calculate available space for content
      const availableHeight =
        doc.internal.pageSize.height -
        yPosition -
        PDF_STYLES.margins.bottom -
        30;
      const maxLines = Math.floor(availableHeight / spacing.lineHeight);

      // Split content to fit on one page
      doc.setFont(fonts.body.name, fonts.body.style);
      doc.setFontSize(fonts.body.size);
      doc.setTextColor(...colors.bodyText);

      const lines = doc.splitTextToSize(r.content, usableWidth - 20);
      const fittedLines = lines.slice(0, maxLines);

      // Add light background for content area
      const contentHeight = Math.min(
        fittedLines.length * spacing.lineHeight + 30,
        availableHeight
      );
      doc.setFillColor(...colors.backgroundAccent);
      doc.roundedRect(
        left - 10,
        contentStartY - 10,
        usableWidth + 20,
        contentHeight,
        PDF_STYLES.radius,
        PDF_STYLES.radius,
        "F"
      );

      // Add content text
      for (let i = 0; i < fittedLines.length; i++) {
        doc.text(fittedLines[i], left, yPosition);
        yPosition += spacing.lineHeight;
      }

      // Add footer with subtle design
      const footerY = doc.internal.pageSize.height - 30;

      // Footer line
      doc.setDrawColor(...colors.lineColor);
      doc.setLineWidth(0.5);
      doc.line(left, footerY, doc.internal.pageSize.width - right, footerY);

      // Footer text
      doc.setFont(fonts.footer.name, fonts.footer.style);
      doc.setFontSize(fonts.footer.size);
      doc.setTextColor(...colors.footerText);

      const footerText = `Medical Record #${r.id} • Generated on ${format(
        new Date(),
        "MMMM d, yyyy"
      )}`;
      doc.text(footerText, doc.internal.pageSize.width / 2, footerY + 15, {
        align: "center",
      });

      // Add confidential watermark (very light)
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(60);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "CONFIDENTIAL",
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height / 2,
        {
          align: "center",
          angle: 45,
        }
      );
      doc.restoreGraphicsState();

      // Save the document
      const safe = r.title.replace(/\W+/g, "_");
      doc.save(`${safe}_${r.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // You could add user-friendly error handling here
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Medical Records</h1>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search + Refresh */}
              <div className="flex items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Search records..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    /* react-query will refetch */
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="all">All Records</TabsTrigger>
                  <TabsTrigger value="reports">Medical Reports</TabsTrigger>
                </TabsList>

                <TabsContent value={tab}>
                  <div className="border rounded-md">
                    {isLoading ? (
                      <div className="p-4 space-y-4">
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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
                          {reports.length > 0 ? (
                            reports.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <Avatar>
                                      <AvatarFallback>
                                        {getInitials(
                                          r.doctor.first_name,
                                          r.doctor.last_name
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <p className="font-medium">
                                      Dr. {r.doctor.first_name}{" "}
                                      {r.doctor.last_name}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="default">Report</Badge>
                                </TableCell>
                                <TableCell>{r.title}</TableCell>
                                <TableCell>
                                  {format(
                                    new Date(r.created_at),
                                    "MMM d, yyyy"
                                  )}
                                </TableCell>
                                <TableCell className="space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewRecord(r)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" /> View
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadPdf(r)}
                                  >
                                    <FileText className="h-4 w-4 mr-1" /> PDF
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-6"
                              >
                                No medical records found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Pagination */}
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <Button
                            size="icon"
                            variant={i + 1 === page ? "default" : "outline"}
                            onClick={() => setPage(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* View Dialog */}
        {selected && (
          <Dialog open={viewOpen} onOpenChange={setViewOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="py-4 prose max-w-none">
                <p>{selected.content}</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setViewOpen(false)}>Close</Button>
                <Button
                  variant="outline"
                  onClick={() => selected && downloadPdf(selected)}
                >
                  <FileText className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ChatWidget role="patient" />
    </DashboardLayout>
  );
}
