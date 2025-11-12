import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import MultiSelect from '../components/MultiSelect'
import './LeadScrapingPage.css'

export default function LeadScrapingPage() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filter states
  const [openFilters, setOpenFilters] = useState({
    contact: true,
    jobTitle: true,
    management: true,
    departments: true,
    names: true,
    company: true,
    location: true
  })
  
  // Contact Filters
  const [emailStatus, setEmailStatus] = useState('')
  const [onlyWithEmail, setOnlyWithEmail] = useState(false)
  const [onlyWithPhone, setOnlyWithPhone] = useState(false)
  
  // Job Title Filters
  const [jobTitlesIncludes, setJobTitlesIncludes] = useState([])
  const [jobTitlesExcludes, setJobTitlesExcludes] = useState([])
  const [includeSimilarTitles, setIncludeSimilarTitles] = useState(false)
  const [additionalTitles, setAdditionalTitles] = useState('')
  
  // Management Level Filters
  const [managementLevelIncludes, setManagementLevelIncludes] = useState([])
  const [managementLevelExcludes, setManagementLevelExcludes] = useState([])
  
  // Departments & Job Function Filters
  const [departmentsIncludes, setDepartmentsIncludes] = useState([])
  const [departmentsExcludes, setDepartmentsExcludes] = useState([])
  
  // Name Filters
  const [firstNameIncludes, setFirstNameIncludes] = useState('')
  const [firstNameExcludes, setFirstNameExcludes] = useState('')
  const [lastNameIncludes, setLastNameIncludes] = useState('')
  const [lastNameExcludes, setLastNameExcludes] = useState('')
  
  // Company Filters
  const [employeeRange, setEmployeeRange] = useState([])
  const [industriesIncludes, setIndustriesIncludes] = useState([])
  const [industriesExcludes, setIndustriesExcludes] = useState([])
  const [foundedYearFrom, setFoundedYearFrom] = useState('')
  const [foundedYearTo, setFoundedYearTo] = useState('')
  const [companyDomains, setCompanyDomains] = useState('')
  
  // Location Filters
  const [companyCountryIncludes, setCompanyCountryIncludes] = useState([])
  const [companyCountryExcludes, setCompanyCountryExcludes] = useState([])
  const [companyStateIncludes, setCompanyStateIncludes] = useState([])
  const [companyStateExcludes, setCompanyStateExcludes] = useState([])
  const [companyCityIncludes, setCompanyCityIncludes] = useState('')
  const [companyCityExcludes, setCompanyCityExcludes] = useState('')

  // Options for dropdowns - Laajennetut listat
  const jobTitleOptions = [
    { value: 'Director', label: 'Director' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Founder', label: 'Founder' },
    { value: 'General Manager', label: 'General Manager' },
    { value: 'Consultant', label: 'Consultant' },
    { value: 'CEO', label: 'CEO' },
    { value: 'Co-Founder', label: 'Co-Founder' },
    { value: 'Account Manager', label: 'Account Manager' },
    { value: 'CFO', label: 'CFO' },
    { value: 'Human Resources Manager', label: 'Human Resources Manager' },
    { value: 'CTO', label: 'CTO' },
    { value: 'CMO', label: 'CMO' },
    { value: 'VP Sales', label: 'VP Sales' },
    { value: 'VP Marketing', label: 'VP Marketing' },
    { value: 'VP Engineering', label: 'VP Engineering' },
    { value: 'Marketing Manager', label: 'Marketing Manager' },
    { value: 'Sales Manager', label: 'Sales Manager' },
    { value: 'Product Manager', label: 'Product Manager' },
    { value: 'Business Development', label: 'Business Development' },
    { value: 'Owner', label: 'Owner' },
    { value: 'President', label: 'President' },
    { value: 'Chief Executive Officer', label: 'Chief Executive Officer' },
    { value: 'Chief Technology Officer', label: 'Chief Technology Officer' },
    { value: 'Chief Financial Officer', label: 'Chief Financial Officer' },
    { value: 'Chief Marketing Officer', label: 'Chief Marketing Officer' }
  ]

  const managementLevelOptions = [
    { value: 'Entry', label: 'Entry' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Director', label: 'Director' },
    { value: 'VP', label: 'VP' },
    { value: 'C-Suite', label: 'C-Suite' },
    { value: 'Owner', label: 'Owner' },
    { value: 'Head', label: 'Head' },
    { value: 'Founder', label: 'Founder' },
    { value: 'Partner', label: 'Partner' },
    { value: 'Intern', label: 'Intern' }
  ]

  const departmentOptions = [
    { value: 'Sales', label: 'Sales' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Product', label: 'Product' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Finance', label: 'Finance' },
    { value: 'HR', label: 'HR' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Business Development', label: 'Business Development' },
    { value: 'Customer Success', label: 'Customer Success' },
    { value: 'Support', label: 'Support' },
    { value: 'IT', label: 'IT' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Accounting', label: 'Accounting' },
    { value: 'Procurement', label: 'Procurement' },
    { value: 'Supply Chain', label: 'Supply Chain' },
    { value: 'Quality Assurance', label: 'Quality Assurance' },
    { value: 'Research & Development', label: 'Research & Development' },
    { value: 'R&D', label: 'R&D' }
  ]

  const employeeRangeOptions = [
    { value: 'Unknown', label: 'Unknown' },
    { value: '1-10', label: '1-10' },
    { value: '11-20', label: '11-20' },
    { value: '21-50', label: '21-50' },
    { value: '51-100', label: '51-100' },
    { value: '101-200', label: '101-200' },
    { value: '201-500', label: '201-500' },
    { value: '501-1000', label: '501-1000' },
    { value: '1001-2000', label: '1001-2000' },
    { value: '2001-5000', label: '2001-5000' },
    { value: '5001-10000', label: '5001-10000' },
    { value: '10001+', label: '10001+' }
  ]

  const industryOptions = [
    { value: 'Accounting', label: 'Accounting' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Airlines/Aviation', label: 'Airlines/Aviation' },
    { value: 'Apparel & Fashion', label: 'Apparel & Fashion' },
    { value: 'Architecture & Planning', label: 'Architecture & Planning' },
    { value: 'Automotive', label: 'Automotive' },
    { value: 'Banking', label: 'Banking' },
    { value: 'Biotechnology', label: 'Biotechnology' },
    { value: 'Computer Software', label: 'Computer Software' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Education', label: 'Education' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Consulting', label: 'Consulting' },
    { value: 'Media', label: 'Media' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Food & Beverage', label: 'Food & Beverage' },
    { value: 'Hospitality', label: 'Hospitality' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Non-profit', label: 'Non-profit' },
    { value: 'Telecommunications', label: 'Telecommunications' },
    { value: 'Construction', label: 'Construction' },
    { value: 'Pharmaceuticals', label: 'Pharmaceuticals' },
    { value: 'Insurance', label: 'Insurance' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Sports', label: 'Sports' }
  ]

  const countryOptions = [
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'India', label: 'India' },
    { value: 'France', label: 'France' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'Brazil', label: 'Brazil' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Spain', label: 'Spain' },
    { value: 'Italy', label: 'Italy' },
    { value: 'Switzerland', label: 'Switzerland' },
    { value: 'Finland', label: 'Finland' },
    { value: 'Sweden', label: 'Sweden' },
    { value: 'Norway', label: 'Norway' },
    { value: 'Denmark', label: 'Denmark' },
    { value: 'Poland', label: 'Poland' },
    { value: 'Japan', label: 'Japan' },
    { value: 'China', label: 'China' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'South Korea', label: 'South Korea' },
    { value: 'Mexico', label: 'Mexico' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'South Africa', label: 'South Africa' },
    { value: 'New Zealand', label: 'New Zealand' }
  ]
  
  // Lead limit
  const [leadLimit, setLeadLimit] = useState(10000)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showJsonModal, setShowJsonModal] = useState(false)
  const [generatedJson, setGeneratedJson] = useState('')
  
  // Results
  const [leads, setLeads] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage, setResultsPerPage] = useState(20)
  const [totalLeads, setTotalLeads] = useState(0)

  const toggleFilter = (key) => {
    setOpenFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const generateApifyJson = () => {
    const filters = {}
    
    // Contact Filters
    if (emailStatus) filters.emailStatus = emailStatus
    if (onlyWithEmail) filters.onlyWithEmail = true
    if (onlyWithPhone) filters.onlyWithPhone = true
    
    // Job Title Filters
    if (jobTitlesIncludes.length > 0) filters.jobTitlesIncludes = jobTitlesIncludes
    if (jobTitlesExcludes.length > 0) filters.jobTitlesExcludes = jobTitlesExcludes
    if (includeSimilarTitles) filters.includeSimilarTitles = true
    if (additionalTitles) filters.additionalTitles = additionalTitles
    
    // Management Level Filters
    if (managementLevelIncludes.length > 0) filters.managementLevelIncludes = managementLevelIncludes
    if (managementLevelExcludes.length > 0) filters.managementLevelExcludes = managementLevelExcludes
    
    // Departments & Job Function Filters
    if (departmentsIncludes.length > 0) filters.departmentsIncludes = departmentsIncludes
    if (departmentsExcludes.length > 0) filters.departmentsExcludes = departmentsExcludes
    
    // Name Filters
    if (firstNameIncludes) filters.firstNameIncludes = firstNameIncludes
    if (firstNameExcludes) filters.firstNameExcludes = firstNameExcludes
    if (lastNameIncludes) filters.lastNameIncludes = lastNameIncludes
    if (lastNameExcludes) filters.lastNameExcludes = lastNameExcludes
    
    // Company Filters
    if (employeeRange.length > 0) filters.employeeRange = employeeRange
    if (industriesIncludes.length > 0) filters.industriesIncludes = industriesIncludes
    if (industriesExcludes.length > 0) filters.industriesExcludes = industriesExcludes
    if (foundedYearFrom) filters.foundedYearFrom = parseInt(foundedYearFrom)
    if (foundedYearTo) filters.foundedYearTo = parseInt(foundedYearTo)
    if (companyDomains) filters.companyDomains = companyDomains
    
    // Location Filters
    if (companyCountryIncludes.length > 0) filters.companyCountryIncludes = companyCountryIncludes
    if (companyCountryExcludes.length > 0) filters.companyCountryExcludes = companyCountryExcludes
    if (companyStateIncludes.length > 0) filters.companyStateIncludes = companyStateIncludes
    if (companyStateExcludes.length > 0) filters.companyStateExcludes = companyStateExcludes
    if (companyCityIncludes) filters.companyCityIncludes = companyCityIncludes
    if (companyCityExcludes) filters.companyCityExcludes = companyCityExcludes
    
    return JSON.stringify(filters, null, 2)
  }

  const handleStartScraping = async () => {
    if (!user?.id) {
      setError('Kirjaudu sisään jatkaaksesi')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const filters = {
        emailStatus: emailStatus || null,
        onlyWithEmail: onlyWithEmail || false,
        onlyWithPhone: onlyWithPhone || false,
        jobTitlesIncludes: jobTitlesIncludes || [],
        jobTitlesExcludes: jobTitlesExcludes || [],
        includeSimilarTitles: includeSimilarTitles || false,
        additionalTitles: additionalTitles || null,
        managementLevelIncludes: managementLevelIncludes || [],
        managementLevelExcludes: managementLevelExcludes || [],
        departmentsIncludes: departmentsIncludes || [],
        departmentsExcludes: departmentsExcludes || [],
        firstNameIncludes: firstNameIncludes || null,
        firstNameExcludes: firstNameExcludes || null,
        lastNameIncludes: lastNameIncludes || null,
        lastNameExcludes: lastNameExcludes || null,
        employeeRange: employeeRange || [],
        industriesIncludes: industriesIncludes || [],
        industriesExcludes: industriesExcludes || [],
        foundedYearFrom: foundedYearFrom ? parseInt(foundedYearFrom) : null,
        foundedYearTo: foundedYearTo ? parseInt(foundedYearTo) : null,
        companyDomains: companyDomains || null,
        companyCountryIncludes: companyCountryIncludes || [],
        companyCountryExcludes: companyCountryExcludes || [],
        companyStateIncludes: companyStateIncludes || [],
        companyStateExcludes: companyStateExcludes || [],
        companyCityIncludes: companyCityIncludes || null,
        companyCityExcludes: companyCityExcludes || null
      }

      const apifyJson = generateApifyJson()

      const response = await fetch('/api/lead-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          filters,
          apifyJson,
          leadLimit: Math.min(leadLimit, 50000)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Scraping aloitus epäonnistui')
      }

      const result = await response.json()
      setSuccess('Scraping aloitettu onnistuneesti! Tarkista tulokset hetken kuluttua.')
      setTimeout(() => setSuccess(''), 5000)
      
      // Lataa liidit heti
      setTimeout(() => {
        fetchLeads()
      }, 2000)

    } catch (err) {
      console.error('Error starting scraping:', err)
      setError(err.message || 'Scraping aloitus epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    if (!user?.id) return

    setLoadingLeads(true)
    setError('')

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userData) {
        throw new Error('Käyttäjää ei löytynyt')
      }

      const { data: leadsData, error: leadsError, count } = await supabase
        .from('scraped_leads')
        .select('*', { count: 'exact' })
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage - 1)

      if (leadsError) throw leadsError

      setLeads(leadsData || [])
      setTotalLeads(count || 0)

    } catch (err) {
      console.error('Error fetching leads:', err)
      setError('Liidien haku epäonnistui: ' + err.message)
    } finally {
      setLoadingLeads(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchLeads()
    }
  }, [user?.id, currentPage, resultsPerPage])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess('JSON kopioitu leikepöydälle!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleGenerateJson = () => {
    const json = generateApifyJson()
    setGeneratedJson(json)
    setShowJsonModal(true)
  }

  const handleGenerateFinalJson = () => {
    const filters = {}
    
    // Contact Filters
    if (emailStatus) filters.emailStatus = emailStatus
    if (onlyWithEmail) filters.onlyWithEmail = true
    if (onlyWithPhone) filters.onlyWithPhone = true
    
    // Job Title Filters
    if (jobTitlesIncludes.length > 0) filters.jobTitlesIncludes = jobTitlesIncludes
    if (jobTitlesExcludes.length > 0) filters.jobTitlesExcludes = jobTitlesExcludes
    if (includeSimilarTitles) filters.includeSimilarTitles = true
    if (additionalTitles) filters.additionalTitles = additionalTitles
    
    // Management Level Filters
    if (managementLevelIncludes.length > 0) filters.managementLevelIncludes = managementLevelIncludes
    if (managementLevelExcludes.length > 0) filters.managementLevelExcludes = managementLevelExcludes
    
    // Departments & Job Function Filters
    if (departmentsIncludes.length > 0) filters.departmentsIncludes = departmentsIncludes
    if (departmentsExcludes.length > 0) filters.departmentsExcludes = departmentsExcludes
    
    // Name Filters
    if (firstNameIncludes) filters.firstNameIncludes = firstNameIncludes
    if (firstNameExcludes) filters.firstNameExcludes = firstNameExcludes
    if (lastNameIncludes) filters.lastNameIncludes = lastNameIncludes
    if (lastNameExcludes) filters.lastNameExcludes = lastNameExcludes
    
    // Company Filters
    if (employeeRange.length > 0) filters.employeeRange = employeeRange
    if (industriesIncludes.length > 0) filters.industriesIncludes = industriesIncludes
    if (industriesExcludes.length > 0) filters.industriesExcludes = industriesExcludes
    if (foundedYearFrom) filters.foundedYearFrom = parseInt(foundedYearFrom)
    if (foundedYearTo) filters.foundedYearTo = parseInt(foundedYearTo)
    if (companyDomains) filters.companyDomains = companyDomains
    
    // Location Filters
    if (companyCountryIncludes.length > 0) filters.companyCountryIncludes = companyCountryIncludes
    if (companyCountryExcludes.length > 0) filters.companyCountryExcludes = companyCountryExcludes
    if (companyStateIncludes.length > 0) filters.companyStateIncludes = companyStateIncludes
    if (companyStateExcludes.length > 0) filters.companyStateExcludes = companyStateExcludes
    if (companyCityIncludes) filters.companyCityIncludes = companyCityIncludes
    if (companyCityExcludes) filters.companyCityExcludes = companyCityExcludes

    const finalJson = {
      ...filters,
      maxResults: Math.min(leadLimit, 50000)
    }

    const jsonString = JSON.stringify(finalJson, null, 2)
    setGeneratedJson(jsonString)
    setShowLimitModal(false)
    setShowJsonModal(true)
  }

  const totalPages = Math.ceil(totalLeads / resultsPerPage)

  return (
    <div className="lead-scraping-page">
      <div className="lead-scraping-header">
        <h1>Liidien Scrapeeminen (Työnalla)</h1>
        <p>Määritä hakukriteerit ja aloita liidien haku Apifyn kautta</p>
      </div>

      {error && (
        <div className="lead-scraping-error">
          {error}
        </div>
      )}

      {success && (
        <div className="lead-scraping-success">
          {success}
        </div>
      )}

      {/* Filters Section */}
      <div className="lead-scraping-filters">
        <div className="filters-actions">
          <Button onClick={() => {
            setEmailStatus('')
            setOnlyWithEmail(false)
            setOnlyWithPhone(false)
            setJobTitlesIncludes([])
            setJobTitlesExcludes([])
            setIncludeSimilarTitles(false)
            setAdditionalTitles('')
            setManagementLevelIncludes([])
            setManagementLevelExcludes([])
            setDepartmentsIncludes([])
            setDepartmentsExcludes([])
            setFirstNameIncludes('')
            setFirstNameExcludes('')
            setLastNameIncludes('')
            setLastNameExcludes('')
            setEmployeeRange([])
            setIndustriesIncludes([])
            setIndustriesExcludes([])
            setFoundedYearFrom('')
            setFoundedYearTo('')
            setCompanyDomains('')
            setCompanyCountryIncludes([])
            setCompanyCountryExcludes([])
            setCompanyStateIncludes([])
            setCompanyStateExcludes([])
            setCompanyCityIncludes('')
            setCompanyCityExcludes('')
          }}>
            Reset Filters
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStartScraping}
            disabled={loading}
          >
            {loading ? 'Aloitetaan...' : 'Search Database'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowLimitModal(true)}
          >
            Generate Apify JSON
          </Button>
        </div>

        {/* Contact Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('contact')}
            type="button"
          >
            <span>Contact Filters</span>
            <span className={`chevron ${openFilters.contact ? 'open' : ''}`}>▾</span>
          </button>
          {openFilters.contact && (
            <div className="filter-group-content">
              <div className="form-field">
                <label>Email Status</label>
                <select value={emailStatus} onChange={(e) => setEmailStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={onlyWithEmail}
                    onChange={(e) => setOnlyWithEmail(e.target.checked)}
                  />
                  Has email
                </label>
              </div>
              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={onlyWithPhone}
                    onChange={(e) => setOnlyWithPhone(e.target.checked)}
                  />
                  Has phone
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Company Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('company')}
            type="button"
          >
            <span>Company Filters</span>
            <span className={`chevron ${openFilters.company ? 'open' : ''}`}>▾</span>
          </button>
          {openFilters.company && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label="Employee range — Includes"
                  options={employeeRangeOptions}
                  value={employeeRange}
                  onChange={setEmployeeRange}
                  placeholder="Select employee ranges to include..."
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Industry — Includes"
                  options={industryOptions}
                  value={industriesIncludes}
                  onChange={setIndustriesIncludes}
                  placeholder="Select industries to include..."
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Industry — Excludes"
                  options={industryOptions}
                  value={industriesExcludes}
                  onChange={setIndustriesExcludes}
                  placeholder="Select industries to exclude..."
                />
              </div>
              <div className="form-field-row">
                <div className="form-field">
                  <label>Founded From</label>
                  <input
                    type="number"
                    value={foundedYearFrom}
                    onChange={(e) => setFoundedYearFrom(e.target.value)}
                    placeholder="e.g. 2020"
                  />
                </div>
                <div className="form-field">
                  <label>Founded To</label>
                  <input
                    type="number"
                    value={foundedYearTo}
                    onChange={(e) => setFoundedYearTo(e.target.value)}
                    placeholder="e.g. 2024"
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Company — Domains</label>
                <input
                  type="text"
                  value={companyDomains}
                  onChange={(e) => setCompanyDomains(e.target.value)}
                  placeholder="Enter company domains (comma-separated)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Location Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('location')}
            type="button"
          >
            <span>Location Filters</span>
            <span className={`chevron ${openFilters.location ? 'open' : ''}`}>▾</span>
          </button>
          {openFilters.location && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label="Company country — Includes"
                  options={countryOptions}
                  value={companyCountryIncludes}
                  onChange={setCompanyCountryIncludes}
                  placeholder="Select countries to include..."
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Company country — Excludes"
                  options={countryOptions}
                  value={companyCountryExcludes}
                  onChange={setCompanyCountryExcludes}
                  placeholder="Select countries to exclude..."
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Company state/region — Includes"
                  options={[]}
                  value={companyStateIncludes}
                  onChange={setCompanyStateIncludes}
                  placeholder="Select states/regions to include..."
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Company state/region — Excludes"
                  options={[]}
                  value={companyStateExcludes}
                  onChange={setCompanyStateExcludes}
                  placeholder="Select states/regions to exclude..."
                />
              </div>
              <div className="form-field">
                <label>Company city — Includes</label>
                <input
                  type="text"
                  value={companyCityIncludes}
                  onChange={(e) => setCompanyCityIncludes(e.target.value)}
                  placeholder="Enter cities to include..."
                />
              </div>
              <div className="form-field">
                <label>Company city — Excludes</label>
                <input
                  type="text"
                  value={companyCityExcludes}
                  onChange={(e) => setCompanyCityExcludes(e.target.value)}
                  placeholder="Enter cities to exclude..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Job Title Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('jobTitle')}
            type="button"
          >
            <span>Job Title Filters</span>
            <span className={`chevron ${openFilters.jobTitle ? 'open' : ''}`}>▾</span>
          </button>
          {openFilters.jobTitle && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label="Job title — Includes"
                  options={jobTitleOptions}
                  value={jobTitlesIncludes}
                  onChange={setJobTitlesIncludes}
                  placeholder="Select job titles to include..."
                />
              </div>
              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={includeSimilarTitles}
                    onChange={(e) => setIncludeSimilarTitles(e.target.checked)}
                  />
                  Include people with similar titles
                </label>
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Job title — Excludes"
                  options={jobTitleOptions}
                  value={jobTitlesExcludes}
                  onChange={setJobTitlesExcludes}
                  placeholder="Select job titles to exclude..."
                />
              </div>
              <div className="form-field">
                <label>Additional titles — Includes (free text)</label>
                <input
                  type="text"
                  value={additionalTitles}
                  onChange={(e) => setAdditionalTitles(e.target.value)}
                  placeholder="e.g. Country Head"
                />
              </div>
            </div>
          )}
        </div>

        {/* Management Level Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('management')}
            type="button"
          >
            <span>Management Level Filters</span>
            <span className={`chevron ${openFilters.management ? 'open' : ''}`}>▾</span>
          </button>
          {openFilters.management && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label="Management level — Includes"
                  options={managementLevelOptions}
                  value={managementLevelIncludes}
                  onChange={setManagementLevelIncludes}
                  placeholder="Select management levels to include..."
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Management level — Excludes"
                  options={managementLevelOptions}
                  value={managementLevelExcludes}
                  onChange={setManagementLevelExcludes}
                  placeholder="Select management levels to exclude..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Departments & Job Function Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('departments')}
            type="button"
          >
            <span>Departments & Job Function Filters</span>
            <span className={`chevron ${openFilters.departments ? 'open' : ''}`}>▾</span>
          </button>
          {openFilters.departments && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label="Departments & job function — Includes"
                  options={departmentOptions}
                  value={departmentsIncludes}
                  onChange={setDepartmentsIncludes}
                  placeholder="Select departments to include..."
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Departments & job function — Excludes"
                  options={departmentOptions}
                  value={departmentsExcludes}
                  onChange={setDepartmentsExcludes}
                  placeholder="Select departments to exclude..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Name Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('names')}
            type="button"
          >
            <span>Name Filters</span>
            <span className={`chevron ${openFilters.names ? 'open' : ''}`}>▾</span>
          </button>
          {openFilters.names && (
            <div className="filter-group-content">
              <div className="form-field">
                <label>First name — Includes</label>
                <input
                  type="text"
                  value={firstNameIncludes}
                  onChange={(e) => setFirstNameIncludes(e.target.value)}
                  placeholder="Enter first names to include..."
                />
              </div>
              <div className="form-field">
                <label>First name — Excludes</label>
                <input
                  type="text"
                  value={firstNameExcludes}
                  onChange={(e) => setFirstNameExcludes(e.target.value)}
                  placeholder="Enter first names to exclude..."
                />
              </div>
              <div className="form-field">
                <label>Last name — Includes</label>
                <input
                  type="text"
                  value={lastNameIncludes}
                  onChange={(e) => setLastNameIncludes(e.target.value)}
                  placeholder="Enter last names to include..."
                />
              </div>
              <div className="form-field">
                <label>Last name — Excludes</label>
                <input
                  type="text"
                  value={lastNameExcludes}
                  onChange={(e) => setLastNameExcludes(e.target.value)}
                  placeholder="Enter last names to exclude..."
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Email Filter Message */}
      <div className="email-filter-message">
        <div className="email-filter-content">
          <div className="email-filter-inner">
            💡 <strong>Need only results with emails and/or phones?</strong> Check the "Only show leads with email addresses" and/or "Only show leads with phone numbers" options in the Contact Filters section above.
          </div>
          <div className="email-filter-inner">
            ⚠️ <strong>"<span className="found">✓ Found</span>" indicates contact data available</strong> - use Generate JSON to scrape full emails, phones & LinkedIn URLs.
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lead-scraping-results">
        <div className="results-header">
          <h2>Scraped Liidit</h2>
          <div className="results-controls">
            <select 
              value={resultsPerPage} 
              onChange={(e) => {
                setResultsPerPage(parseInt(e.target.value))
                setCurrentPage(1)
              }}
            >
              <option value="10">10 per sivu</option>
              <option value="20">20 per sivu</option>
              <option value="50">50 per sivu</option>
              <option value="100">100 per sivu</option>
            </select>
            <Button variant="secondary" onClick={fetchLeads} disabled={loadingLeads}>
              {loadingLeads ? 'Ladataan...' : 'Päivitä'}
            </Button>
          </div>
        </div>

        {loadingLeads ? (
          <div className="loading-state">Ladataan liidejä...</div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            Ei liidejä vielä. Aloita scraping yllä olevilla filttereillä.
          </div>
        ) : (
          <>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Nimi</th>
                    <th>Sähköposti</th>
                    <th>Puhelin</th>
                    <th>Tehtävä</th>
                    <th>Yritys</th>
                    <th>Kaupunki</th>
                    <th>Maa</th>
                    <th>LinkedIn</th>
                    <th>Pisteet</th>
                    <th>Tila</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || '-'}</td>
                      <td>{lead.email || '-'}</td>
                      <td>{lead.phone || '-'}</td>
                      <td>{lead.position || '-'}</td>
                      <td>{lead.org_name || '-'}</td>
                      <td>{lead.city || lead.org_city || '-'}</td>
                      <td>{lead.country || lead.org_country || '-'}</td>
                      <td>
                        {lead.linkedin_url ? (
                          <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                            LinkedIn
                          </a>
                        ) : '-'}
                      </td>
                      <td>{lead.score !== null && lead.score !== undefined ? lead.score : '-'}</td>
                      <td>
                        <span className={`status-badge status-${lead.status || 'pending'}`}>
                          {lead.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  « Edellinen
                </button>
                <span>
                  Sivu {currentPage} / {totalPages} (yhteensä {totalLeads} liidiä)
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Seuraava »
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lead Limit Modal */}
      {showLimitModal && (
        <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setShowLimitModal(false)}>
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">📊 Lead Extraction Settings</h2>
              <button className="modal-close-btn" onClick={() => setShowLimitModal(false)} type="button">×</button>
            </div>
            <div className="modal-content">
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>💡</span>
                  <strong>Maximum leads per run: 50,000</strong>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', lineHeight: '1.4', color: '#6b7280' }}>
                  You can set any limit below this. Our actor is designed to be persistent - if you have a search of 100k leads,
                  you can run a 50k scrape and then run another 50k scrape starting where you left off.
                </p>
              </div>
              <div className="form-field">
                <label htmlFor="total-results-input" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  How many leads do you want to extract?
                </label>
                <input
                  type="number"
                  id="total-results-input"
                  min="1"
                  max="50000"
                  value={leadLimit}
                  onChange={(e) => setLeadLimit(Math.min(parseInt(e.target.value) || 10000, 50000))}
                  placeholder="Enter number of leads (max 50,000)"
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button variant="primary" onClick={handleGenerateFinalJson}>
                  Generate JSON
                </Button>
                <Button variant="secondary" onClick={() => setShowLimitModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Output Modal */}
      {showJsonModal && (
        <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setShowJsonModal(false)}>
          <div className="modal-container" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 className="modal-title">🚀 Apify Actor Input JSON</h2>
              <button className="modal-close-btn" onClick={() => setShowJsonModal(false)} type="button">×</button>
            </div>
            <div className="modal-content">
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>How to use this JSON:</h4>
                <ol style={{ paddingLeft: '20px', color: '#6b7280' }}>
                  <li style={{ marginBottom: '8px' }}>Copy the JSON below</li>
                  <li style={{ marginBottom: '8px' }}>Go to your Apify actor dashboard</li>
                  <li style={{ marginBottom: '8px' }}>Paste this JSON as the input configuration</li>
                  <li style={{ marginBottom: '8px' }}>Run the actor to extract the specified number of leads</li>
                  <li style={{ marginBottom: '8px' }}>Download your results when the run completes</li>
                </ol>
              </div>
              <div style={{ margin: '20px 0' }}>
                <pre style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, border: '1px solid #e5e7eb', color: '#1f2937', lineHeight: '1.5', maxHeight: '400px', overflow: 'auto' }}>
                  {generatedJson}
                </pre>
              </div>
              <Button variant="primary" onClick={() => copyToClipboard(generatedJson)}>
                Copy to Clipboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

