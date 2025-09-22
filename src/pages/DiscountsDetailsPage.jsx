import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";

function DiscountsDetailsPage() {
    const pageName = "Discounts";
    const statTitle = "Total Saved";
    const statValue = "UGX 250,000";

    const overviewGroup = {
        title: "Discounts Overview",
        rows: [
            ["Discounts used this year", "5"],
            ["Avg. discount value", "UGX 50,000"],
            ["Next available discount", "Loan Fee Waiver"],
            ["Eligibility", "Active Member"],
        ],
    };

    const tableHeaders = ["Date", "Amount Saved", "Description", "Type"];

    const allTransactions = [
        { id: 1, date: '2025-03-05', amount: 'UGX 100,000', description: 'Loan Processing Fee', type: 'Waiver' },
        { id: 2, date: '2025-07-20', amount: 'UGX 150,000', description: 'Interest Rate Reduction', type: 'Reduction' },
    ];

    return (
        <BaseDetailsPage
            pageName={pageName}
            statTitle={statTitle}
            statValue={statValue}
            overviewGroup={overviewGroup}
            tableHeaders={tableHeaders}
            allTransactions={allTransactions}
        />
    );
}

export default DiscountsDetailsPage;