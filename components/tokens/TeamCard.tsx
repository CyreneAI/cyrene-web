'use client'

import React from 'react'

interface TeamMember {
  name: string
  handle?: string
}

interface TeamCardProps {
  title?: string
  members: TeamMember[]
}

const TeamCard: React.FC<TeamCardProps> = ({ title = 'Team', members }) => {
  return (
    <div className="bg-[#040A25] rounded-[30px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-white">{title}</h4>
        <div className="text-white/90">{members.length}</div>
      </div>
      <ul className="space-y-2">
        {members.map((m, idx) => (
          <li key={idx} className="flex items-center justify-between text-sm">
            <span className="text-gray-300">{m.name}</span>
            {m.handle && (
              <a
                className="text-blue-400 hover:underline"
                href={`https://x.com/${m.handle.replace('@','')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {m.handle}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamCard