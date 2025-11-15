import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import axios from 'axios'
import { createPortal } from 'react-dom'
import Button from '../components/Button'
import MultiSelect from '../components/MultiSelect'
import '../components/ModalComponents.css'
import './LeadScrapingPage.css'

export default function LeadScrapingPage() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filter states
  const [openFilters, setOpenFilters] = useState({
    contact: false,
    jobTitle: false,
    management: false,
    departments: false,
    names: false,
    company: false,
    peopleLocation: false,
    companyLocation: false,
    leadLimit: false
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
  
  // Location Filters - People
  const [peopleCountryIncludes, setPeopleCountryIncludes] = useState([])
  const [peopleCountryExcludes, setPeopleCountryExcludes] = useState([])
  const [peopleStateIncludes, setPeopleStateIncludes] = useState([])
  const [peopleStateExcludes, setPeopleStateExcludes] = useState([])
  const [peopleCityIncludes, setPeopleCityIncludes] = useState('')
  const [peopleCityExcludes, setPeopleCityExcludes] = useState('')
  
  // Location Filters - Company
  const [companyCountryIncludes, setCompanyCountryIncludes] = useState([])
  const [companyCountryExcludes, setCompanyCountryExcludes] = useState([])
  const [companyStateIncludes, setCompanyStateIncludes] = useState([])
  const [companyStateExcludes, setCompanyStateExcludes] = useState([])
  const [companyCityIncludes, setCompanyCityIncludes] = useState('')
  const [companyCityExcludes, setCompanyCityExcludes] = useState('')

  // Options for dropdowns - Pipeline Labs mukaan
  const jobTitleOptions = [
    'Director', 'Manager', 'Founder', 'General Manager', 'Consultant', 'Chief Executive Officer', 'Co-Founder', 'Account Manager', 'Chief Financial Officer', 'Human Resources Manager', 'Director Of Marketing', 'Executive Director', 'Executive Assistant', 'Administrative Assistant', 'Director Of Human Resources', 'Associate', 'Chief Operating Officer', 'HR Manager', 'Account Executive', 'Business Development Manager', 'Director Of Operations', 'Controller', 'Chief Technology Officer', 'Chief Information Officer', 'Founder & CEO', 'Attorney', 'IT Manager', 'Assistant Manager', 'Engineer', 'Business Analyst', 'Accountant', 'Chief Marketing Officer', 'Creative Director', 'Director Of Sales', 'Graphic Designer', 'Analyst', 'Human Resources Director', 'Founder And CEO', 'Digital Marketing Manager', 'Business Owner', 'Assistant Professor', 'Branch Manager', 'HR Director', 'Administrator', 'Customer Service Representative', 'HR Business Partner', 'Designer', 'Intern', 'Lecturer', 'Architect', 'Information Technology Manager', 'Co-Founder & CEO', 'Co-Owner', 'Business Development', 'IT Director', 'Associate Professor', 'Finance Manager', 'Director Of Business Development', 'Developer', 'Business Manager', 'Director Of Engineering', 'Human Resources', 'Customer Service', 'Key Account Manager', 'Executive Vice President', 'Financial Analyst', 'HR Generalist', 'Financial Advisor', 'Instructor', 'Engineering Manager', 'Art Director', 'Director Of Sales And Marketing', 'Area Manager', 'CEO & Founder', 'Director Of Finance', 'Data Analyst', 'Associate Director', 'Accounting Manager', 'Customer Service Manager', 'IT Specialist', 'Account Director', 'Data Scientist', 'District Manager', 'Human Resources Business Partner', 'Co-Founder And CEO', 'Assistant Principal', 'Information Technology Director', 'Facilities Manager', 'Director Human Resources', 'Executive', 'Human Resources Generalist', 'Design Engineer', 'CEO & Co-Founder', 'IT Project Manager', 'Electrical Engineer', 'Finance Director', 'Head Of Marketing', 'Independent Consultant', 'Agent', 'Brand Manager', 'Buyer', 'Financial Controller', 'Broker', 'Human Resource Manager', 'Adjunct Professor', 'Customer Success Manager', 'Artist', 'Chairman', 'Graduate Student', 'CEO And Founder', 'Director Of IT', 'Educator', 'Founder/CEO', 'IT Consultant', 'HR Coordinator', 'Lawyer', 'Chief Human Resources Officer', 'Dentist', 'Editor', 'Legal Assistant', 'Director Of Technology', 'Interior Designer', 'Chief Operations Officer', 'Business Development Executive', 'HR Specialist', 'Devops', 'Community Manager', 'Civil Engineer', 'Attorney At Law', 'Associate Consultant', 'CEO And Co-Founder', 'Electrician', 'General Counsel', 'District Sales Manager', 'Director Of Product Management', 'Assistant', 'Driver', 'Auditor', 'Director Marketing', 'Business Consultant', 'Assistant Vice President', 'Digital Marketing Specialist', 'Deputy Manager', 'Human Resources Coordinator', 'English Teacher', 'Board Member', 'IT Analyst', 'Insurance Agent', 'Founding Partner', 'Event Manager', 'Director Of Development', 'Co-Founder & CTO', 'Auxiliar Administrativo', 'Database Administrator', 'Admin', 'Graduate Research Assistant', 'Associate Attorney', 'Chief Information Security Officer', 'Director Of HR', 'Chief Engineer', 'Communications Manager', 'Construction Manager', 'Coordinator', 'Director Of Communications', 'Estimator', 'Corporate Recruiter', 'Business Development Director', 'Enterprise Architect', 'Case Manager', 'Bookkeeper', 'Chief Revenue Officer', 'Analista', 'Assistente Administrativo', 'Bartender', 'Advisor', 'Development Manager', 'Co-Founder', 'CEO', 'Human Resources Specialist', 'Broker Associate', 'Doctor', 'Assistant Director', 'Consultor', 'CTO/Cio', 'Event Coordinator', 'Chef', 'Chief Product Officer', 'Director Of Digital Marketing', 'Application Developer', 'HR Assistant', 'HR Executive', 'Directeur', 'Executive Administrative Assistant', 'Captain', 'Licensed Realtor', 'Business Development Representative', 'Associate Broker', 'Director Of Sales & Marketing', 'Commercial Manager', 'HR Consultant', 'Management Trainee', 'Finance', 'Flight Attendant', 'Lead Engineer', 'Director Of Marketing And Communications', 'Manager', 'Human Resources', 'Assistant Project Manager', 'Application Engineer', 'Logistics Manager', 'Assistant General Manager', 'Lead Software Engineer', 'Employee', 'Founder And President', 'Independent Distributor', 'Director Of Recruiting', 'CEO/Founder', 'Associate Creative Director', 'Assistant Store Manager', 'Barista', 'Director Of Product Marketing', 'Corporate Controller', 'Director Of Talent Acquisition', 'Administrativo', 'Assistant Controller', 'Legal Secretary', 'Author', 'Commercial Director', 'Chief People Officer', 'Inside Sales Representative', 'Devops Engineer', 'Co-Founder And CTO', 'Broker/Owner', 'Advogado', 'Field Engineer', 'Maintenance Manager', 'Clerk', 'Field Service Engineer', 'Cofounder', 'Human Resources Assistant', 'Executive Chef', 'IT Administrator', 'General Sales Manager', 'Director', 'Business Development', 'Franchise Owner', 'Customer Service Supervisor', 'Adjunct Faculty', 'Benefits Manager', 'Inside Sales', 'Abogado', 'Java Developer', 'Head Of Product', 'Management Consultant', 'Contracts Manager', 'Freelance Writer', 'CEO/President/Owner', 'Journalist', 'Associate Software Engineer', 'Head Of HR', 'Internal Auditor', 'Head Of Information Technology', 'Founder & President', 'Accounting', 'Freelancer', 'Front Office Manager', 'Entrepreneur', 'HR Administrator', 'Graduate Teaching Assistant', 'Director Of Sales Operations', 'Diretor', 'Data Engineer', 'Librarian', 'Facility Manager', 'Administration', 'IT Architect', 'Legal Counsel', 'Maintenance Supervisor', 'Head Of Operations', 'Founder / CEO', 'Chief Strategy Officer', 'Communications Director', 'Development Director', 'Content Marketing Manager', 'Internship', 'Counselor', 'Assistant Superintendent', 'Business Systems Analyst', 'Design Director', 'CEO/President', 'Manager', 'Marketing', 'Coach', 'Freelance Graphic Designer', 'Lead Developer', 'Associate Manager', 'Android Developer', 'IT Department Manager', 'IT Engineer', 'Chiropractor', 'Credit Analyst', 'Independent Business Owner', 'Adjunct Instructor', 'Head Of Human Resources', 'Brand Ambassador', 'Copywriter', 'Chairman & CEO', 'Email Marketing Manager', 'Frontend Developer', 'Human Resource Director', 'Client Services Manager', 'IT Support Specialist', 'Contract Manager', 'Impiegato', 'CEO', 'Founder', 'Chief Medical Officer', 'Banker', 'Director Information Technology', 'Director Of Product', 'Director', 'Product Management', 'Country Manager', 'Financial Consultant', 'Administrador', 'Executive Assistant To CEO', 'Advogada', 'Field Marketing Manager', 'Business Intelligence Analyst', 'Director Marketing', 'Loan Officer', 'Freelance Photographer', 'Actor', 'Chef De Projet', 'Foreman', 'Information Technology Project Manager', 'Graduate Assistant', 'Inside Sales Manager', 'Department Manager', 'HR Officer', 'Account Coordinator', 'Deputy Director', 'Director Of Facilities', 'Executive Recruiter', 'IT Technician', 'CEO', 'Co-Founder', 'Full Stack Developer', 'CEO / Founder', 'Counsel', 'Logistics Coordinator', 'Founder And Chief Executive Officer', 'Chairman And CEO', 'Administrative Coordinator', 'Director Business Development', 'Category Manager', 'Data Architect', 'Information Technology', 'Head Of Sales', 'Chief Information Officer (Cio)', 'IT Recruiter', 'Information Security Analyst', 'Associate General Counsel', 'Inspector', 'Admin Assistant', 'Dispatcher', 'Contractor', 'Design Manager', 'Ecommerce Manager', 'Chief Technical Officer', 'Field Service Technician', 'Executive Secretary', 'Co-Founder', 'CTO', 'Director', 'Talent Acquisition', 'Accounting Assistant', 'Director', 'IT', 'Account Supervisor', 'Human Resources Administrator', 'Faculty', 'Administrative Officer', 'Front End Developer', 'Content Manager', 'Freelance', 'Maintenance Technician', 'Business Development Specialist', 'Business Development Consultant', 'Communications Specialist', 'Director', 'Product Marketing', 'Client Manager', 'Compliance Officer', 'Executive Producer', 'Customer Service Specialist', 'Certified Personal Trainer', 'Human Resources Executive', 'Chief Executive', 'HR Advisor', 'Compliance Manager', 'Head Of IT', 'IT Business Analyst', 'Homemaker', 'Events Manager', 'Fleet Manager', 'CEO & President', 'Carpenter', 'HR Recruiter', 'Director', 'Digital Marketing', 'Laboratory Technician', 'Associate Product Manager', 'Director Product Management', 'Independent Contractor', 'Accounts Payable', 'Digital Marketing Director', 'Instructional Designer', 'Digital Project Manager', 'Audit Manager', 'Estudante', 'Credit Manager', 'Eigenaar', 'Business Developer', 'Head Of Business Development', 'Avvocato', 'Chief Administrative Officer', 'Asset Manager', 'Accounts Payable Specialist', 'Chief Compliance Officer', 'Empleado', 'Digital Marketing Executive', 'Account Representative', 'Campaign Manager', 'Director', 'Engineering', 'Engagement Manager', 'Management', 'Delivery Manager', 'Manager Human Resources', 'Cook', 'Director Of Product Development', 'Information Technology Specialist', 'Chief Of Staff', 'Associate Vice President', 'Company Director', 'Chief Technology Officer (CTO)', 'Digital Marketing Consultant', 'Firefighter', 'Business Operations Manager', 'Crew Member', 'Director - Human Resources', 'Caregiver', 'Customer Experience Manager', 'Financial Accountant', 'Customer Service Rep', 'Bank Teller', 'IT Operations Manager', 'Management Accountant', 'Digital Marketing', 'Investigator', 'Enterprise Account Executive', 'Logistics', 'Deputy General Manager', 'Freelance Designer', 'Economist', 'Digital Marketing Coordinator', 'Co-Founder & COO', 'Chief Architect', 'Learning And Development Manager', 'Director General', 'Distributor', 'Associate Marketing Manager', 'Abogada', 'Assistant General Counsel', 'Machine Operator', 'Delivery Driver', 'Comercial', 'Chemist', 'Hostess', 'Lead Consultant', 'Director Of Training', 'Financial Representative', 'Maintenance', 'Audit Associate', 'Housewife', 'Assistant Accountant', 'Financial Manager', 'Maintenance Engineer', 'Contract Administrator', 'First Officer', 'Director Of Marketing Communications', 'Comptable', 'Finance Officer', 'Financial Planner', 'Automation Engineer', 'Administrativa', 'Estudiante', 'Accounts Manager', 'Customer Service Associate', 'Investment Banking Analyst', 'Director HR'
  ].map(title => ({ value: title, label: title }))

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
    'Accounting', 'Administrative', 'Arts & Design', 'Business Development', 'Consulting', 'Data Science', 'Education', 'Engineering', 'Entrepreneurship', 'Finance', 'Human Resources', 'Information Technology', 'Legal', 'Marketing', 'Media & Communications', 'Operations', 'Product Management', 'Research', 'Sales', 'Support'
  ].map(dept => ({ value: dept, label: dept }))

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
    'Accounting', 'Agriculture', 'Airlines/Aviation', 'Alternative Dispute Resolution', 'Animation', 'Apparel & Fashion', 'Architecture & Planning', 'Arts & Crafts', 'Automotive', 'Aviation & Aerospace', 'Banking', 'Biotechnology', 'Broadcast Media', 'Building Materials', 'Business Supplies & Equipment', 'Capital Markets', 'Chemicals', 'Civic & Social Organization', 'Civil Engineering', 'Commercial Real Estate', 'Computer & Network Security', 'Computer Games', 'Computer Hardware', 'Computer Networking', 'Computer Software', 'Construction', 'Consumer Electronics', 'Consumer Goods', 'Consumer Services', 'Cosmetics', 'Dairy', 'Defense & Space', 'Design', 'E-Learning', 'Education Management', 'Electrical/Electronic Manufacturing', 'Entertainment', 'Environmental Services', 'Events Services', 'Executive Office', 'Facilities Services', 'Farming', 'Financial Services', 'Fine Art', 'Food & Beverages', 'Food Production', 'Fundraising', 'Furniture', 'Gambling & Casinos', 'Glass', 'Ceramics & Concrete', 'Government Administration', 'Government Relations', 'Graphic Design', 'Health', 'Wellness & Fitness', 'Higher Education', 'Hospital & Health Care', 'Hospitality', 'Human Resources', 'Import & Export', 'Individual & Family Services', 'Industrial Automation', 'Information Services', 'Information Technology & Services', 'Insurance', 'International Affairs', 'International Trade & Development', 'Internet', 'Investment Banking', 'Investment Management', 'Judiciary', 'Law Enforcement', 'Law Practice', 'Legal Services', 'Legislative Office', 'Leisure', 'Travel & Tourism', 'Libraries', 'Logistics & Supply Chain', 'Luxury Goods & Jewelry', 'Machinery', 'Management Consulting', 'Maritime', 'Market Research', 'Marketing & Advertising', 'Mechanical or Industrial Engineering', 'Media Production', 'Medical Devices', 'Medical Practice', 'Mental Health Care', 'Military', 'Mining & Metals', 'Motion Pictures & Film', 'Museums & Institutions', 'Music', 'Nanotechnology', 'Newspapers', 'Non-Profit Organization Management', 'Non-Profits & Non-Profit Services', 'Oil & Energy', 'Online Media', 'Outsourcing/Offshoring', 'Package/Freight Delivery', 'Packaging & Containers', 'Paper & Forest Products', 'Performing Arts', 'Pharmaceuticals', 'Philanthropy', 'Photography', 'Plastics', 'Political Organization', 'Primary/Secondary Education', 'Printing', 'Professional Training & Coaching', 'Program Development', 'Public Policy', 'Public Relations & Communications', 'Public Safety', 'Publishing', 'Railroad Manufacture', 'Ranching', 'Real Estate', 'Recreation & Sports', 'Recreational Facilities & Services', 'Religious Institutions', 'Renewables & Environment', 'Research', 'Restaurants', 'Retail', 'Security & Investigations', 'Semiconductors', 'Shipbuilding', 'Sporting Goods', 'Sports', 'Staffing & Recruiting', 'Supermarkets', 'Telecommunications', 'Textiles', 'Think Tanks', 'Tobacco', 'Translation & Localization', 'Transportation/Trucking/Railroad', 'Utilities', 'Venture Capital & Private Equity', 'Veterinary', 'Warehousing', 'Wholesale', 'Wine & Spirits', 'Wireless', 'Writing & Editing'
  ].map(industry => ({ value: industry, label: industry }))

  const countryOptions = [
    'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Macedonia (FYROM)', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'
  ].map(country => ({ value: country, label: country }))
  
  // Lead limit
  const [leadLimit, setLeadLimit] = useState(10000)
  
  // Results
  const [leads, setLeads] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage, setResultsPerPage] = useState(20)
  const [totalLeads, setTotalLeads] = useState(0)
  
  // Lead details modal
  const [selectedLead, setSelectedLead] = useState(null)
  const [showLeadModal, setShowLeadModal] = useState(false)

  const toggleFilter = (key) => {
    setOpenFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const generateApifyJson = () => {
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
      peopleCountryIncludes: peopleCountryIncludes || [],
      peopleCountryExcludes: peopleCountryExcludes || [],
      peopleStateIncludes: peopleStateIncludes || [],
      peopleStateExcludes: peopleStateExcludes || [],
      peopleCityIncludes: peopleCityIncludes || null,
      peopleCityExcludes: peopleCityExcludes || null,
      companyCountryIncludes: companyCountryIncludes || [],
      companyCountryExcludes: companyCountryExcludes || [],
      companyStateIncludes: companyStateIncludes || [],
      companyStateExcludes: companyStateExcludes || [],
      companyCityIncludes: companyCityIncludes || null,
      companyCityExcludes: companyCityExcludes || null
    }
    
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
        peopleCountryIncludes: peopleCountryIncludes || [],
        peopleCountryExcludes: peopleCountryExcludes || [],
        peopleStateIncludes: peopleStateIncludes || [],
        peopleStateExcludes: peopleStateExcludes || [],
        peopleCityIncludes: peopleCityIncludes || null,
        peopleCityExcludes: peopleCityExcludes || null,
        companyCountryIncludes: companyCountryIncludes || [],
        companyCountryExcludes: companyCountryExcludes || [],
        companyStateIncludes: companyStateIncludes || [],
        companyStateExcludes: companyStateExcludes || [],
        companyCityIncludes: companyCityIncludes || null,
        companyCityExcludes: companyCityExcludes || null
      }

      const apifyJson = generateApifyJson()

      const response = await axios.post('/api/lead-scraping', {
        filters,
        apifyJson,
        leadLimit: Math.min(leadLimit, 50000)
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      if (response.data.success) {
        setSuccess('Scraping aloitettu onnistuneesti! Tarkista tulokset hetken kuluttua.')
      } else {
        throw new Error(response.data.error || 'Scraping aloitus epäonnistui')
      }
      setTimeout(() => setSuccess(''), 5000)
      
      // Lataa liidit heti
      setTimeout(() => {
        fetchLeads()
      }, 2000)

    } catch (err) {
      console.error('Error starting scraping:', err)
      setError(err.response?.data?.error || err.message || 'Scraping aloitus epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    if (!user?.id) return

    setLoadingLeads(true)
    setError('')

    try {
      // Hae käyttäjän token
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        throw new Error('Kirjaudu sisään jatkaaksesi')
      }

      // Hae liidit API-endpointin kautta
      const response = await axios.get('/api/leads', {
        params: {
          page: currentPage,
          perPage: resultsPerPage
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setLeads(response.data.leads || [])
        setTotalLeads(response.data.total || 0)
      } else {
        throw new Error(response.data.error || 'Liidien haku epäonnistui')
      }

    } catch (err) {
      console.error('Error fetching leads:', err)
      setError('Liidien haku epäonnistui: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoadingLeads(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchLeads()
    }
  }, [user?.id, currentPage, resultsPerPage])


  const totalPages = Math.ceil(totalLeads / resultsPerPage)

  // Count active filters for each group
  const getFilterCount = (group) => {
    switch(group) {
      case 'contact':
        let contactCount = 0
        if (emailStatus) contactCount++
        if (onlyWithEmail) contactCount++
        if (onlyWithPhone) contactCount++
        return contactCount
      case 'jobTitle':
        let jobTitleCount = 0
        if (jobTitlesIncludes.length > 0) jobTitleCount++
        if (jobTitlesExcludes.length > 0) jobTitleCount++
        if (includeSimilarTitles) jobTitleCount++
        if (additionalTitles) jobTitleCount++
        return jobTitleCount
      case 'management':
        let managementCount = 0
        if (managementLevelIncludes.length > 0) managementCount++
        if (managementLevelExcludes.length > 0) managementCount++
        return managementCount
      case 'departments':
        let departmentsCount = 0
        if (departmentsIncludes.length > 0) departmentsCount++
        if (departmentsExcludes.length > 0) departmentsCount++
        return departmentsCount
      case 'names':
        let namesCount = 0
        if (firstNameIncludes) namesCount++
        if (firstNameExcludes) namesCount++
        if (lastNameIncludes) namesCount++
        if (lastNameExcludes) namesCount++
        return namesCount
      case 'company':
        let companyCount = 0
        if (employeeRange.length > 0) companyCount++
        if (industriesIncludes.length > 0) companyCount++
        if (industriesExcludes.length > 0) companyCount++
        if (foundedYearFrom) companyCount++
        if (foundedYearTo) companyCount++
        if (companyDomains) companyCount++
        return companyCount
      case 'peopleLocation':
        let peopleLocationCount = 0
        if (peopleCountryIncludes.length > 0) peopleLocationCount++
        if (peopleCountryExcludes.length > 0) peopleLocationCount++
        if (peopleStateIncludes.length > 0) peopleLocationCount++
        if (peopleStateExcludes.length > 0) peopleLocationCount++
        if (peopleCityIncludes) peopleLocationCount++
        if (peopleCityExcludes) peopleLocationCount++
        return peopleLocationCount
      case 'companyLocation':
        let companyLocationCount = 0
        if (companyCountryIncludes.length > 0) companyLocationCount++
        if (companyCountryExcludes.length > 0) companyLocationCount++
        if (companyStateIncludes.length > 0) companyLocationCount++
        if (companyStateExcludes.length > 0) companyLocationCount++
        if (companyCityIncludes) companyLocationCount++
        if (companyCityExcludes) companyLocationCount++
        return companyLocationCount
      default:
        return 0
    }
  }

  return (
    <div className="lead-scraping-page">
      <div className="lead-scraping-header">
        <h1>Liidien Scrapeeminen (Työnalla)</h1>
        <p>Määritä hakukriteerit ja aloita liidien haku Apifyn kautta</p>
      </div>

      {error && (
        <div className="lead-scraping-error" style={{ margin: '0 24px', marginTop: '16px' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="lead-scraping-success" style={{ margin: '0 24px', marginTop: '16px' }}>
          {success}
        </div>
      )}

      <div className="lead-scraping-content-wrapper">
        {/* Filters Sidebar */}
        <div className="lead-scraping-filters">
          <div className="filters-actions">
            <div className="filters-actions-buttons">
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
                setPeopleCountryIncludes([])
                setPeopleCountryExcludes([])
                setPeopleStateIncludes([])
                setPeopleStateExcludes([])
                setPeopleCityIncludes('')
                setPeopleCityExcludes('')
                setCompanyCountryIncludes([])
                setCompanyCountryExcludes([])
                setCompanyStateIncludes([])
                setCompanyStateExcludes([])
                setCompanyCityIncludes('')
                setCompanyCityExcludes('')
                setLeadLimit(10000)
              }}>
                Reset Filters
              </Button>
              <Button 
                variant="primary" 
                onClick={handleStartScraping}
                disabled={loading}
              >
                {loading ? 'Aloitetaan...' : 'Aloita'}
              </Button>
            </div>
          </div>

          <div className="filters-content">
            {/* Contact Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('contact')}
            type="button"
          >
            <span>Contact Filters</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFilterCount('contact') > 0 && (
                <span className="filter-count-badge">{getFilterCount('contact')}</span>
              )}
              <span className={`chevron ${openFilters.contact ? 'open' : ''}`}>▾</span>
            </span>
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFilterCount('company') > 0 && (
                <span className="filter-count-badge">{getFilterCount('company')}</span>
              )}
              <span className={`chevron ${openFilters.company ? 'open' : ''}`}>▾</span>
            </span>
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
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Industry — Excludes"
                  options={industryOptions}
                  value={industriesExcludes}
                  onChange={setIndustriesExcludes}
                  placeholder="Select industries to exclude..."
                  searchable={true}
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

        {/* People Location Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('peopleLocation')}
            type="button"
          >
            <span>People Location Filters</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFilterCount('peopleLocation') > 0 && (
                <span className="filter-count-badge">{getFilterCount('peopleLocation')}</span>
              )}
              <span className={`chevron ${openFilters.peopleLocation ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.peopleLocation && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label="People country — Includes"
                  options={countryOptions}
                  value={peopleCountryIncludes}
                  onChange={setPeopleCountryIncludes}
                  placeholder="Select countries to include..."
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="People country — Excludes"
                  options={countryOptions}
                  value={peopleCountryExcludes}
                  onChange={setPeopleCountryExcludes}
                  placeholder="Select countries to exclude..."
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="People state/region — Includes"
                  options={[]}
                  value={peopleStateIncludes}
                  onChange={setPeopleStateIncludes}
                  placeholder="Select states/regions to include..."
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="People state/region — Excludes"
                  options={[]}
                  value={peopleStateExcludes}
                  onChange={setPeopleStateExcludes}
                  placeholder="Select states/regions to exclude..."
                />
              </div>
              <div className="form-field">
                <label>People city — Includes</label>
                <input
                  type="text"
                  value={peopleCityIncludes}
                  onChange={(e) => setPeopleCityIncludes(e.target.value)}
                  placeholder="Enter cities to include..."
                />
              </div>
              <div className="form-field">
                <label>People city — Excludes</label>
                <input
                  type="text"
                  value={peopleCityExcludes}
                  onChange={(e) => setPeopleCityExcludes(e.target.value)}
                  placeholder="Enter cities to exclude..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Company Location Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('companyLocation')}
            type="button"
          >
            <span>Company Location Filters</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFilterCount('companyLocation') > 0 && (
                <span className="filter-count-badge">{getFilterCount('companyLocation')}</span>
              )}
              <span className={`chevron ${openFilters.companyLocation ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.companyLocation && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label="Company country — Includes"
                  options={countryOptions}
                  value={companyCountryIncludes}
                  onChange={setCompanyCountryIncludes}
                  placeholder="Select countries to include..."
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Company country — Excludes"
                  options={countryOptions}
                  value={companyCountryExcludes}
                  onChange={setCompanyCountryExcludes}
                  placeholder="Select countries to exclude..."
                  searchable={true}
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFilterCount('jobTitle') > 0 && (
                <span className="filter-count-badge">{getFilterCount('jobTitle')}</span>
              )}
              <span className={`chevron ${openFilters.jobTitle ? 'open' : ''}`}>▾</span>
            </span>
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
                  searchable={true}
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
                  searchable={true}
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFilterCount('management') > 0 && (
                <span className="filter-count-badge">{getFilterCount('management')}</span>
              )}
              <span className={`chevron ${openFilters.management ? 'open' : ''}`}>▾</span>
            </span>
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
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Management level — Excludes"
                  options={managementLevelOptions}
                  value={managementLevelExcludes}
                  onChange={setManagementLevelExcludes}
                  placeholder="Select management levels to exclude..."
                  searchable={true}
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFilterCount('departments') > 0 && (
                <span className="filter-count-badge">{getFilterCount('departments')}</span>
              )}
              <span className={`chevron ${openFilters.departments ? 'open' : ''}`}>▾</span>
            </span>
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
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label="Departments & job function — Excludes"
                  options={departmentOptions}
                  value={departmentsExcludes}
                  onChange={setDepartmentsExcludes}
                  placeholder="Select departments to exclude..."
                  searchable={true}
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFilterCount('names') > 0 && (
                <span className="filter-count-badge">{getFilterCount('names')}</span>
              )}
              <span className={`chevron ${openFilters.names ? 'open' : ''}`}>▾</span>
            </span>
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

        {/* Lead Limit */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('leadLimit')}
            type="button"
          >
            <span>Tulosten määrä</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`chevron ${openFilters.leadLimit ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.leadLimit && (
            <div className="filter-group-content">
              <div className="form-field">
                <label htmlFor="lead-limit">Tulosten määrä</label>
                <input
                  id="lead-limit"
                  type="number"
                  min="1"
                  max="50000"
                  value={leadLimit}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    setLeadLimit(Math.min(Math.max(value, 1), 50000))
                  }}
                  placeholder="10000"
                />
              </div>
            </div>
          )}
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
                    <th>Toiminnot</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || '-'}</td>
                      <td>{lead.email || '-'}</td>
                      <td>{lead.phone || '-'}</td>
                      <td>{lead.position || '-'}</td>
                      <td>{lead.orgName || '-'}</td>
                      <td>{lead.city || lead.orgCity || '-'}</td>
                      <td>{lead.country || lead.orgCountry || '-'}</td>
                      <td>
                        {lead.linkedinUrl ? (
                          <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer">
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
                      <td>
                        <button
                          className="view-details-btn"
                          onClick={() => {
                            setSelectedLead(lead)
                            setShowLeadModal(true)
                          }}
                          title="Näytä kaikki tiedot"
                        >
                          Näytä
                        </button>
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
      </div>

      {/* Lead Details Modal */}
      {showLeadModal && selectedLead && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLeadModal(false)
              setSelectedLead(null)
            }
          }}
        >
          <div className="lead-details-modal modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Liidin kaikki tiedot</h2>
              <button
                onClick={() => {
                  setShowLeadModal(false)
                  setSelectedLead(null)
                }}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-content lead-details-content">
              {/* Henkilön tiedot */}
              <div className="lead-details-section">
                <h3>Henkilön tiedot</h3>
                <div className="lead-details-grid">
                  <div className="lead-detail-item">
                    <label>Etunimi:</label>
                    <span>{selectedLead.firstName || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Sukunimi:</label>
                    <span>{selectedLead.lastName || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Koko nimi:</label>
                    <span>{selectedLead.fullName || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Sähköposti:</label>
                    <span>{selectedLead.email || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Puhelin:</label>
                    <span>{selectedLead.phone || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Tehtävä:</label>
                    <span>{selectedLead.position || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Seniority:</label>
                    <span>{selectedLead.seniority || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Functional:</label>
                    <span>
                      {Array.isArray(selectedLead.functional) 
                        ? selectedLead.functional.join(', ') 
                        : selectedLead.functional || '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>LinkedIn:</label>
                    <span>
                      {selectedLead.linkedinUrl ? (
                        <a href={selectedLead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          {selectedLead.linkedinUrl}
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Kaupunki:</label>
                    <span>{selectedLead.city || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Osavaltio/Maakunta:</label>
                    <span>{selectedLead.state || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Maa:</label>
                    <span>{selectedLead.country || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Organisaation tiedot */}
              <div className="lead-details-section">
                <h3>Organisaation tiedot</h3>
                <div className="lead-details-grid">
                  <div className="lead-detail-item">
                    <label>Yrityksen nimi:</label>
                    <span>{selectedLead.orgName || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Verkkosivusto:</label>
                    <span>
                      {selectedLead.orgWebsite ? (
                        <a href={selectedLead.orgWebsite} target="_blank" rel="noopener noreferrer">
                          {selectedLead.orgWebsite}
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>LinkedIn URL:</label>
                    <span>
                      {Array.isArray(selectedLead.orgLinkedinUrl) && selectedLead.orgLinkedinUrl.length > 0
                        ? selectedLead.orgLinkedinUrl.map((url, idx) => (
                            <span key={idx}>
                              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                              {idx < selectedLead.orgLinkedinUrl.length - 1 && ', '}
                            </span>
                          ))
                        : selectedLead.orgLinkedinUrl || '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Perustettu:</label>
                    <span>{selectedLead.orgFoundedYear || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Toimiala:</label>
                    <span>
                      {Array.isArray(selectedLead.orgIndustry) 
                        ? selectedLead.orgIndustry.join(', ') 
                        : selectedLead.orgIndustry || '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Koko:</label>
                    <span>{selectedLead.orgSize || '-'}</span>
                  </div>
                  <div className="lead-detail-item lead-detail-item--full">
                    <label>Kuvaus:</label>
                    <span>{selectedLead.orgDescription || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Kaupunki:</label>
                    <span>{selectedLead.orgCity || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Osavaltio/Maakunta:</label>
                    <span>{selectedLead.orgState || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>Maa:</label>
                    <span>{selectedLead.orgCountry || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button onClick={() => {
                setShowLeadModal(false)
                setSelectedLead(null)
              }}>
                Sulje
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

