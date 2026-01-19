# Invoice Generator

A simple, client-side invoice generator that creates professional PDF invoices.

## Features

- **Easy Form-Based Input**: Fill in your information, client details, and items
- **Automatic Calculations**: Item totals and balance due are calculated automatically
- **PDF Generation**: Generate professional PDF invoices with one click
- **Address Book**: Save client addresses in localStorage for quick reuse
- **Invoice Numbering**: Automatic invoice number incrementing (stored in localStorage)
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. Fill in your name and address (pre-filled for convenience)
2. Enter invoice date (defaults to today) and invoice number (auto-increments)
3. Add client details or select from saved addresses
4. Add items with description, quantity, and unit price
5. Click "Generate PDF" to create and download your invoice

## Technical Details

- Pure HTML, CSS, and JavaScript
- Uses [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) for PDF generation
- Data stored in browser localStorage (address book and invoice numbers)
- No server required - runs entirely in the browser

## Hosting

This project is hosted on GitHub Pages at: `https://jaceypenny.github.io/invoice-generator/`
