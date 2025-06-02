// src/pages/SelectCompany.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { CompanyContext } from '../contexts/CompanyContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

interface Company {
  id: string
  name: string
  icon?: React.ReactNode
}

const companies: Company[] = [
  { id: 'onarev', name: 'ONAREV' },
  { id: 'unkin', name: 'UNIKIN' },
  { id: 'occ', name: 'OCC' },
  { id: 'senat', name: 'SÉNAT RDC' },
  { id: 'assemblee', name: 'ASSEMBLÉE NATIONALE RDC' },
  { id: 'gecamines', name: 'GÉCAMINES' },
  { id: 'dgda', name: 'DGDA' },
  { id: 'igf', name: 'IGF' },
]

export default function SelectCompany() {
  const navigate = useNavigate()
  const { selectCompany } = useContext(CompanyContext)

  const handleClick = (companyId: string) => {
    selectCompany(companyId)
    navigate('/auth/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Sélectionnez votre entreprise</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {companies.map((c) => (
          <Card
            key={c.id}
            onClick={() => handleClick(c.id)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>{c.name}</span>
            <Button variant="ghost">→</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
