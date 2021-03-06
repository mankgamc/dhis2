package org.hisp.dhis.reports.upward.action;

import java.util.Collection;
import java.util.Iterator;

import org.hisp.dhis.period.PeriodService;
import org.hisp.dhis.period.PeriodType;
import org.hisp.dhis.reports.ReportType;

import com.opensymphony.xwork2.Action;

public class GenerateUpwardReportAnalyserFormAction
    implements Action
{

    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------

    private PeriodService periodService;

    public void setPeriodService( PeriodService periodService )
    {
        this.periodService = periodService;
    }

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private Collection<PeriodType> periodTypes;

    public Collection<PeriodType> getPeriodTypes()
    {
        return periodTypes;
    }

    private String reportTypeName;

    public String getReportTypeName()
    {
        return reportTypeName;
    }

    // -------------------------------------------------------------------------
    // Action implementation
    // -------------------------------------------------------------------------
    public String execute()
        throws Exception
    {
        reportTypeName = ReportType.RT_GOI;

        periodTypes = periodService.getAllPeriodTypes();

        // Filtering Periodtypes other than Monthly, Quarterly and Yearly
        Iterator<PeriodType> periodTypeIterator = periodTypes.iterator();
        while ( periodTypeIterator.hasNext() )
        {
            PeriodType type = periodTypeIterator.next();
            if ( type.getName().equalsIgnoreCase( "Monthly" ) || type.getName().equalsIgnoreCase( "quarterly" )
                || type.getName().equalsIgnoreCase( "yearly" ) )
            {
            }
            else
            {
                periodTypeIterator.remove();
            }
        }

        return SUCCESS;
    }
}
