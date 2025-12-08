export const generateBusinessInsights = (
    analyticsData: any,
    summaryStats: any
): string[] => {
    const insights: string[] = [];
    const { revenueData, complaintCategories, monthlyEnrollment, planDistribution } = analyticsData;

    // 1. Revenue Analysis
    if (revenueData && revenueData.length >= 2) {
        const lastMonth = revenueData[revenueData.length - 1];
        const prevMonth = revenueData[revenueData.length - 2];

        // Check for growth
        if (lastMonth.revenue > prevMonth.revenue) {
            const growth = ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
            insights.push(`Revenue is currently on an upward trend, showing a ${growth.toFixed(1)}% increase compared to last month. This indicates successful adoption of current meal plans.`);
        } else {
            const decline = ((prevMonth.revenue - lastMonth.revenue) / prevMonth.revenue) * 100;
            insights.push(`Revenue has decreased by ${decline.toFixed(1)}% this month. Consider launching a promotional campaign or a limited-time festive menu to boost sales.`);
        }
    }

    // 2. Complaint Analysis
    const totalComplaints = summaryStats.pendingComplaints;
    if (totalComplaints > 5) {
        insights.push(`There is a backlog of ${totalComplaints} unresolved complaints. Prioritize resolving these to improve student satisfaction and retention rates.`);
    }

    if (complaintCategories && complaintCategories.length > 0) {
        // Find top complaint category
        const topComplaint = complaintCategories.reduce((prev: any, current: any) =>
            (prev.count > current.count) ? prev : current
        );

        if (topComplaint.category === 'Food Quality') {
            insights.push(`"Food Quality" is the top complaint category. Consider auditing the kitchen staff or reviewing recent supplier deliveries.`);
        } else if (topComplaint.category === 'Hygiene') {
            insights.push(`"Hygiene" reports are concerning. Schedule an immediate deep cleaning and staff hygiene training session.`);
        } else if (topComplaint.category === 'Service') {
            insights.push(`Students are reporting "Service" issues. Review peak hour staffing levels to reduce wait times.`);
        }
    }

    // 3. Enrollment Analysis
    if (monthlyEnrollment && monthlyEnrollment.length >= 2) {
        const lastMonthEnrol = monthlyEnrollment[monthlyEnrollment.length - 1];
        if (lastMonthEnrol.students > 10) { // arbitrary threshold
            insights.push(`Strong enrollment numbers this month (+${lastMonthEnrol.students} new students). Ensure food inventory is adjusted to meet the increased demand.`);
        }
    }

    // 4. Plan Popularity
    if (planDistribution && planDistribution.length > 0) {
        const topPlan = planDistribution.reduce((prev: any, current: any) =>
            (prev.value > current.value) ? prev : current
        );
        insights.push(`The "${topPlan.name}" is your most popular plan. Consider introducing a premium variation of this plan to increase average revenue per user.`);
    }

    // Fallback if no specific insights
    if (insights.length === 0) {
        insights.push("Data collection is stabilizing. Continue monitoring daily operations to generate more specific trends.");
    }

    return insights;
};
