import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { PartnerService } from '../../../../services/partner/partner.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { Partner } from '../../../../models/partnerData.model';
import { BookingService } from '../../../../services/booking.service';
Chart.register(...registerables);

@Component({
  selector: 'app-multiple-unit-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multiple-unit-dashboard.component.html',
  styleUrl: './multiple-unit-dashboard.component.css',
})
export class MultipleUnitDashboardComponent implements OnInit {
  labeldata: string[] = [];
  realdata: number[] = [];
  colordata: string[] = [];
  chart: Chart<'doughnut', number[], string> | undefined;
  partnerId: string = '';
  partnerDetails: Partner | null = null;
  partnerUnitCount: number = 0;
  partnerOperators: any[] = [];

  items = [
    {
      imgSrc: 'assets/images/vehicle-available.svg',
      count: 0,
      text: 'Vehicle Available',
      color: '#9bb4fc',
    },
    {
      imgSrc: 'assets/images/driver-available.svg',
      count: 0,
      text: 'Driver Available',
      color: 'rgb(216 184 247)',
    },
    {
      imgSrc: 'assets/images/completed.svg',
      count: 0,
      text: 'Completed',
      color: 'rgb(200 191 255)',
    },
    {
      imgSrc: 'assets/images/ongoing.svg',
      count: 0,
      text: 'Ongoing',
      color: 'rgb(145 230 241)',
    },
    {
      imgSrc: 'assets/images/awaiting.svg',
      count: 0,
      text: 'Awaiting',
      color: 'rgb(178 253 209)',
    },
  ];

  constructor(
    private partnerService: PartnerService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService,
    private bookingService: BookingService
  ) {}

  getPartnerId(): string {
    return localStorage.getItem('partnerId') || '';
  }

  ngOnInit(): void {
    this.partnerId = this.getPartnerId();
    this.getPartnerDetails();
    this.loadChartData();
  }

  getPartnerDetails() {
    this.spinnerService.show();
    this.partnerService.getPartnerDetails(this.partnerId).subscribe(
      (response) => {
        this.partnerDetails = response.data;

        if (this.partnerDetails) {
          // Combine operators and extraOperators into one array
          const operators = this.partnerDetails.operators || [];
          const extraOperators = this.partnerDetails.extraOperators || [];

          // Flatten operators and operatorsDetail arrays
          operators.forEach((operator: any) => {
            operator.operatorsDetail.forEach((detail: any) => {
              this.partnerOperators.push({
                unitClassification: operator.unitClassification,
                subClassification: operator.subClassification,
                firstName: detail.firstName,
                lastName: detail.lastName,
                plateInformation: operator.plateInformation,
                status: detail.status
              });
            });
          });

          // Add extraOperators to the same array
          extraOperators.forEach((extraOperator: any) => {
            this.partnerOperators.push({
              unitClassification: extraOperator.unitClassification,
              subClassification: extraOperator.subClassification,
              firstName: extraOperator.firstName,
              lastName: extraOperator.lastName,
              status: extraOperator.status
            });
          });

          // Calculate the total number of operators details
          const operatorDetailCount = this.partnerDetails.operators.reduce(
            (total, operator) =>
              total + (operator.operatorsDetail?.length || 0),
            0
          );

          // Get the count of extra operators
          const extraOperatorsCount =
            this.partnerDetails.extraOperators?.length || 0;

          // Calculate total drivers count
          const totalDriversCount = operatorDetailCount + extraOperatorsCount;

          // Update items with the total drivers count
          this.items = this.items.map((item) => {
            if (item.text === 'Driver Available') {
              return {
                ...item,
                count: totalDriversCount,
              };
            }
            if (item.text === 'Vehicle Available') {
              return {
                ...item,
                count: this.partnerDetails?.operators?.length || 0,
              };
            }
            return item;
          });

          // Now, fetch completed bookings
          this.getCompletedBookingsCount();
        } else {
          this.spinnerService.hide();
          this.toastr.error('No partner details found', 'Error');
        }
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage, 'Error');
      }
    );
  }

  getCompletedBookingsCount() {
    const bookingRequests = this.partnerDetails?.bookingRequest || [];

    // If there are no booking requests, update items and load chart
    if (bookingRequests.length === 0) {
      this.updateItemsWithCompletedAndRunningCounts(0, 0, 0);
      this.spinnerService.hide();
      return;
    }

    let completedCount = 0;
    let runningCount = 0;
    let awaitingCount = 0;
    let processedCount = 0;

    // Loop through all booking requests and fetch the booking details
    bookingRequests.forEach((booking) => {
      this.bookingService.getBookingsByBookingId(booking.bookingId).subscribe(
        (bookingResponse) => {
          const bookingStatus = bookingResponse.data.bookingStatus;
          if (bookingStatus === 'Completed') {
            completedCount++;
          } else if (bookingStatus === 'Running') {
            runningCount++;
          } else if (bookingStatus === 'Yet to start') {
            awaitingCount++;
          }

          processedCount++;

          // After processing each booking, check if all bookings have been processed
          if (processedCount === bookingRequests.length) {
            this.updateItemsWithCompletedAndRunningCounts(
              completedCount,
              runningCount,
              awaitingCount
            );
            this.spinnerService.hide();
          }
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage, 'Error');
          processedCount++;

          if (processedCount === bookingRequests.length) {
            this.updateItemsWithCompletedAndRunningCounts(
              completedCount,
              runningCount,
              awaitingCount
            );
            this.spinnerService.hide();
          }
        }
      );
    });
  }

  updateItemsWithCompletedAndRunningCounts(
    completedCount: number,
    runningCount: number,
    awaitingCount: number
  ) {
    this.items = this.items.map((item) => {
      if (item.text === 'Completed') {
        return {
          ...item,
          count: completedCount,
        };
      } else if (item.text === 'Ongoing') {
        // Update the Ongoing count
        return {
          ...item,
          count: runningCount,
        };
      } else if (item.text === 'Awaiting') {
        // Update the Awaiting count
        return {
          ...item,
          count: awaitingCount,
        };
      }
      return item;
    });

    this.loadChartData(); // Reload chart data after updating items
  }

  loadChartData() {
    if (this.items != null) {
      this.labeldata = this.items.map((b) => b.text);
      this.realdata = this.items.map((b) => b.count);
      this.colordata = this.items.map((b) => b.color);
      this.renderChart(this.labeldata, this.realdata, this.colordata);
    }
  }

  renderChart(labeldata: string[], valuedata: number[], colordata: string[]) {
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart('doughnutchart', {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: valuedata,
            backgroundColor: colordata,
          },
        ],
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function (tooltipItem: any) {
                const label = tooltipItem.label;
                const value = tooltipItem.raw;
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    });

    this.renderAnnotations(labeldata, valuedata, colordata);
  }

  renderAnnotations(labels: string[], values: number[], colors: string[]) {
    const annotationsElement = document.getElementById('chart-annotations');
    if (!annotationsElement) {
      console.error('Annotations element not found');
      return;
    }

    // Clear previous annotations
    annotationsElement.innerHTML = '';

    labels.forEach((label: string, index: number) => {
      const value = values[index];
      const color = colors[index];

      const annotationDiv = document.createElement('div');
      annotationDiv.classList.add('annotation');
      annotationDiv.innerHTML = `
        <div class="circle-forData" style="background-color:${color};"></div>
        <div class="annotation-label">${label}</div>
        <div class="annotation-value">${value}</div>
      `;
      annotationsElement.appendChild(annotationDiv);
    });
  }

  getStatusColor(bookingRequests: any[] = []): string {
    return Array.isArray(bookingRequests) &&
      bookingRequests.some((request) => request.paymentStatus)
      ? 'red'
      : 'green';
  }
}
