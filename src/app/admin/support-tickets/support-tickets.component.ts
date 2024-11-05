import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportSupportService } from '../../../services/report/report.service';
import {
  faEdit,
  faTrashAlt,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFile, faFileExcel } from '@fortawesome/free-regular-svg-icons';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketModalComponent } from './ticket-modal/ticket-modal.component';
import { TranslateModule } from '@ngx-translate/core';

interface Ticket {
  id: string;
  title: string;
  customer: string;
  isOpen: boolean;
  date: string;
  responseMessage: string;
}

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule],
  templateUrl: './support-tickets.component.html',
  styleUrl: './support-tickets.component.css',
})
export class SupportTicketsComponent implements OnInit {
  currentTab: string = 'All';
  searchQuery: string = '';
  allTickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  showForm: boolean = false;
  selectedTicket: Ticket = {
    id: '',
    title: '',
    customer: '',
    isOpen: false,
    date: '',
    responseMessage: '',
  };
  reply: string = '';
  selectedStatus: string = '';

  faEdit = faEdit;
  faTrashAlt = faTrashAlt;
  faFile = faFile;
  faFileExcel = faFileExcel;
  faArrowLeft = faArrowLeft;

  constructor(
    private reportService: ReportSupportService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.fetchTickets();
  }

  fetchTickets() {
    this.reportService.getAllTickets().subscribe((response) => {
      this.allTickets = response.data.map((ticket: any) => ({
        id: ticket._id,
        title: ticket.reportMessage,
        customer: ticket.name,
        isOpen: ticket.isOpen,
        date: new Date(ticket.createdAt).toLocaleString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        responseMessage: ticket.responseMessage || '',
      }));
      this.filterTickets();
    });
  }

  setTab(tab: string) {
    this.currentTab = tab;
    this.filterTickets();
  }

  filterTickets() {
    this.filteredTickets = this.allTickets.filter((ticket) => {
      if (this.currentTab === 'All') {
        return true;
      } else if (this.currentTab === 'Open') {
        return ticket.isOpen === true;
      } else if (this.currentTab === 'Closed') {
        return ticket.isOpen === false;
      }
      return false;
    });
  }

  onSearch() {
    this.filteredTickets = this.allTickets.filter((ticket) =>
      ticket.customer.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  viewTicketDetails(ticket: Ticket) {
    this.selectedTicket = { ...ticket };
    this.selectedStatus = ticket.isOpen ? 'Close ticket' : 'Open ticket';
    this.showForm = true;
  }

  goBackToList() {
    this.showForm = false;
  }

  toggleStatus() {
    this.selectedStatus = this.selectedTicket.isOpen
      ? 'Open ticket'
      : 'Close ticket';
  }

  onSubmitReply() {
    const { id, responseMessage } = this.selectedTicket;

    this.spinnerService.show();
    this.reportService.updateTicket(id, responseMessage).subscribe(
      (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        this.showForm = false;
        this.filterTickets();
      },
      (error) => {
        this.toastr.error(error);
      }
    );
  }

  openTicketModal(ticketId: string): void {
    const modalRef = this.modalService.open(TicketModalComponent, {
      size: 'md',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
    modalRef.componentInstance.ticketId = ticketId;
    this.filterTickets();
  }
}
