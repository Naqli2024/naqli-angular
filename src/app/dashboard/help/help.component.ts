import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help.component.html',
  styleUrl: './help.component.css',
})
export class HelpComponent {
  faqs = [
    {
      question: 'How do I book a vehicle through your website?',
      answer:
        'To book a vehicle, simply choose the type of service you need, select the date and time, enter the value of the product, specify any additional labour required, and provide the pickup and delivery locations. Once you filled out the necessary information, submit your booking request to receive quotes from our partners.',

      open: false,
    },
    {
      question: 'How long does it take to receive a quote after booking?',
      answer:
        "Once the booking request is submitted, our module will obtain quotes from partners within 5 seconds. You'll receive the  top 3 lowest price to choose from.",
      open: false,
    },
    {
      question: 'Can I choose my preferred vendor?',
      answer:
        'Yes! After receiving quotes, you can select the vendor that  best fits your budget and requirements.',
      open: false,
    },
    {
      question: 'What payment option do you offer?',
      answer:
        'You can choose to pay the full amount upfront or pay a partial advance. Payment methods include credit/debit card and other secure option available on our site.',
      open: false,
    },
    {
      question: 'How can I track my order?',
      answer:
        "After your booking is confirmed and the order has started , you can view the live location of your vehicle in the 'Booking' section. You'll receive detailed information including the vendor name, operator name , the type of vehicle selected, as well as the booking status and payment status for your convenience.",
      open: false,
    },
    {
      question: 'Will I be notified when my driver is arriving?',
      answer:
        'Yes, the driver will notify you once they are en route to your location, ensuring you are informed about their arrival time.',
      open: false,
    },
    {
      question: 'What should I do if I need to cancel my booking?',
      answer:
        'If you need to cancel your booking you can easily do so by clicking the cancel icon located in the top right corner during the vendor selection process. Follow the prompts to complete your cancellation. ',
      open: false,
    },
    {
      question: 'Are there any additional fee that I should be aware of?',
      answer:
        'While we aim provide clear pricing, additional fees may apply based on specific services or circumstances. This will be disclosed in the quotes you receive. ',
      open: false,
    },
    {
      question: 'What happen if my vehicle does not arrive on time?',
      answer:
        'If your vehicle is late , please contact our support team. We will assist you in tracking the status and addressing the issues',
      open: false,
    },
    {
      question: 'How do I contact customer support?',
      answer:
        'You can reach our customer support team via the report section in the website or email to us. We are here to assist you for 24 hours.',
      open: false,
    },
  ];

  toggleOpen(faq: any) {
    faq.open = !faq.open;
  }
}
