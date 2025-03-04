import { Component } from '@angular/core';
import {
  faEdit,
  faPrint,
  faDownload,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { BookingService } from '../../../services/booking.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { PartnerService } from '../../../services/partner/partner.service';
import { UserService } from '../../../services/user.service';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    TranslateModule,
    QRCodeModule,
  ],
  templateUrl: './invoiceUser.component.html',
  styleUrl: './invoice.component.css',
})
export class InvoiceUserComponent {
  isInvoiceTableVisible = true;
  faEdit = faEdit;
  faPrint = faPrint;
  faDownload = faDownload;
  faArrowLeft = faArrowLeft;
  bookingsWithInvoice: any[] = [];
  detailedBookings: any[] = [];
  selectedInvoiceId: string | null = null;
  searchTerm: string = '';
  filteredBookings: any[] = [];
  qrCodeData: string = '';

  constructor(
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private partnerService: PartnerService,
    private userService: UserService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.fetchBookingsWithInvoice();
  }

  createInvoice(bookingId: string): void {
    this.selectedInvoiceId = bookingId;
    this.isInvoiceTableVisible = false;

    // Find the selected booking from the detailedBookings
    const booking = this.detailedBookings.find(
      (b) => b.invoiceId === bookingId
    );
    if (booking) {
      // Generate a URL with query parameters for the booking details
      const baseUrl = 'https://naqlee.com/home/user/invoice-data';
      const queryParams = new URLSearchParams({
        InvoiceId: booking.invoiceId,
        InvoiceDate: booking.invoiceDate,
        CustomerName: `${booking.userDetails?.firstName} ${booking.userDetails?.lastName}`,
        PaymentAmount: booking.paymentAmount.toString(),
        Address: booking.userDetails?.address1 || '',
        bookingId: booking._id,
        unitType: booking.unitType,
        partnerName: booking.partnerDetails?.partnerName,
        paymentType: booking.paymentType
      });

      // Encode the URL into the QR code
      this.qrCodeData = `${baseUrl}?${queryParams.toString()}`;
    }
  }

  goBackToList() {
    this.isInvoiceTableVisible = true;
    this.qrCodeData = '';
  }

  fetchBookingsWithInvoice(): void {
    this.spinnerService.show();
    this.bookingService.getBookingsWithInvoice().subscribe(
      (response) => {
        this.spinnerService.hide();
        if (response.success) {
          // Fetch all bookings first
          const allBookings = response.bookings;

          // Filter bookings that belong to the logged-in user and have a valid invoiceId
          const loggedInUserId = localStorage.getItem('userId');
          this.bookingsWithInvoice = allBookings.filter(
            (booking) => booking.user === loggedInUserId && booking.invoiceId
          );

          // Start fetching partner and user details for each filtered booking
          this.enrichBookingsWithDetails();

          // Optionally, update filteredBookings based on a search term or other criteria
          this.filteredBookings = this.bookingsWithInvoice;
        } else {
          this.toastr.error(response.message);
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch bookings with invoiceId.');
      }
    );
  }

  filterBookings(): void {
    const searchTermLower = this.searchTerm.toLowerCase(); // Convert search term to lowercase for case-insensitive comparison

    this.filteredBookings = this.bookingsWithInvoice.filter((booking) => {
      return (
        booking.invoiceId.toLowerCase().includes(searchTermLower) || // Filter by Invoice id
        (booking.date &&
          booking.date.toLowerCase().includes(searchTermLower)) || // Filter by Date (if the format is string)
        (booking.userDetails?.firstName &&
          booking.userDetails?.firstName
            .toLowerCase()
            .includes(searchTermLower)) || // Filter by User first name
        (booking.userDetails?.lastName &&
          booking.userDetails?.lastName
            .toLowerCase()
            .includes(searchTermLower)) || // Filter by User last name
        (booking.partnerDetails?.partnerName &&
          booking.partnerDetails?.partnerName
            .toLowerCase()
            .includes(searchTermLower)) // Filter by Partner name
      );
    });
  }

  onSearchInputChange(): void {
    this.filterBookings();
  }

  // Helper function to extract and format the Invoice Date
  getInvoiceDate(invoiceId: string): string {
    // Extract the date part from invoiceId (format: INV-20241223-iPvoZ5)
    const dateString = invoiceId.split('-')[1]; // Get the date portion "20241223"

    // Format the date to "dd/MM/yyyy"
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);

    // Return formatted date
    return `${day}/${month}/${year}`;
  }

  enrichBookingsWithDetails(): void {
    const loggedInUserId = localStorage.getItem('userId');

    // Iterate over all bookings
    this.bookingsWithInvoice.forEach((booking) => {
      // Process only the bookings made by the logged-in user and that have an invoiceId
      if (booking.user === loggedInUserId && booking.invoiceId) {
        const partnerId = booking.partner;
        const userId = booking.user;
        booking.invoiceDate = this.getInvoiceDate(booking.invoiceId);

        // Fetch partner details
        this.partnerService.getPartnerDetails(partnerId).subscribe(
          (partner) => {
            booking.partnerDetails = partner.data;
            this.checkIfBookingIsComplete(booking);
          },
          (error) => {
            // console.error('Error fetching partner details', error);
            this.toastr.error('Failed to fetch partner details');
          }
        );

        // Fetch user details for the logged-in user
        this.userService.getUserById(userId).subscribe(
          (user) => {
            booking.userDetails = user;
            this.checkIfBookingIsComplete(booking);
          },
          (error) => {
            // console.error('Error fetching user details', error);
            this.toastr.error('Failed to fetch user details');
          }
        );
      }
    });
  }

  // Helper method to check if both partner and user details are loaded
  private checkIfBookingIsComplete(booking: any): void {
    if (booking.partnerDetails && booking.userDetails) {
      // If both user and partner details are available, add the booking to detailedBookings array
      this.detailedBookings.push(booking);
    }
  }

  downloadInvoice() {
    const element = document.getElementById('invoice-container'); // Use the appropriate ID for the invoice container

    // Create PDF using html2pdf
    const options = {
      filename: 'invoice.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    html2pdf(element, options);
  }

  printInvoice() {
    const element = document.getElementById('invoice-container'); // Get the element to capture

    if (element) {
      html2canvas(element, {
        useCORS: true,
        scale: 2,
      })
        .then((canvas) => {
          const doc = new jsPDF();

          // Get the content dimensions
          const contentWidth = canvas.width;
          const contentHeight = canvas.height;

          // Get the page dimensions of the PDF
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;

          // Set the margins (e.g., 10px on the left and right, 20px on the top)
          const marginLeft = 10;
          const marginTop = 20;
          const marginRight = 10;

          // Calculate the scale factor based on the page width and content width
          const scaleFactor =
            (pageWidth - marginLeft - marginRight) / contentWidth;

          // Calculate the x position (starting from the left margin)
          const x = marginLeft;

          // Set the y position to start from the top margin
          const y = marginTop;

          // Add image to the PDF, scaling it to fit the page and keeping aspect ratio
          doc.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            x,
            y,
            contentWidth * scaleFactor,
            contentHeight * scaleFactor
          );

          // Trigger the print dialog automatically after adding the image
          doc.autoPrint();

          // Generate the PDF and open it in a new window for printing
          const pdfBlob = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          const printWindow = window.open(pdfUrl, '_blank');

          if (printWindow) {
            printWindow.print(); // Trigger the print dialog in the new window
          } else {
            // console.error('Failed to open print window');
          }
        })
        .catch((error) => {
          // console.error('Error capturing element:', error);
        });
    } else {
      // console.error('Invoice container not found');
    }
  }
}
