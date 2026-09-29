import re

with open('apps/web/components/erp/erp-shell.tsx', 'r') as f:
    content = f.read()

# Replace main Link class
content = content.replace(
    '''className={`erp-nav-item relative flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${''',
    '''className={`erp-nav-item relative flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-all duration-200 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${'''
)

# Add icon hover animation
content = content.replace(
    '''<Icon size={18} aria-hidden strokeWidth={active ? 2.2 : 2} />''',
    '''<Icon size={18} aria-hidden strokeWidth={active ? 2.2 : 2} className="transition-transform duration-300 group-hover:scale-110" />'''
)

# Main chevron button
content = content.replace(
    '''onClick={() => toggleDestination(destination.id)} className="grid size-9 shrink-0 place-items-center rounded-lg text-[#6b7280] hover:bg-white hover:text-[#155e55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">\n                      {destinationOpen(destination.id) ? <ChevronUp size={17} aria-hidden /> : <ChevronDown size={17} aria-hidden />}''',
    '''onClick={() => toggleDestination(destination.id)} className="grid size-9 shrink-0 place-items-center rounded-lg text-[#6b7280] hover:bg-white hover:text-[#155e55] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">\n                      <ChevronDown size={17} aria-hidden className={`transition-transform duration-300 ${destinationOpen(destination.id) ? 'rotate-180' : ''}`} />'''
)

# Inner nodes wrapper
content = content.replace(
    '''{!iconOnly && nodes.length > 0 && destinationOpen(destination.id) ? (\n                  <div className="mb-2 mr-4 mt-1 space-y-1 border-r border-[#d7e4e2] pr-2">''',
    '''{!iconOnly && nodes.length > 0 ? (\n                  <div className={`grid transition-all duration-300 ease-in-out ${destinationOpen(destination.id) ? 'grid-rows-[1fr] opacity-100 mb-2 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>\n                    <div className="overflow-hidden">\n                      <div className="mr-4 space-y-1 border-r border-[#d7e4e2] pr-2">'''
)
content = content.replace(
    '''                  </div>\n                ) : null}\n              </div>''',
    '''                      </div>\n                    </div>\n                  </div>\n                ) : null}\n              </div>'''
)

# Inner link styling
content = content.replace(
    '''className={`flex h-10 min-w-0 flex-1 items-center rounded-lg px-3 text-right text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${''',
    '''className={`flex h-10 min-w-0 flex-1 items-center rounded-lg px-3 text-right text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${'''
)

# Inner chevron button
content = content.replace(
    '''onClick={() => toggleGroup(destination.id, node.id)} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#737373] hover:bg-white hover:text-[#155e55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">\n                                {groupOpen(destination.id, node.id) ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}''',
    '''onClick={() => toggleGroup(destination.id, node.id)} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#737373] hover:bg-white hover:text-[#155e55] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">\n                                <ChevronDown size={15} aria-hidden className={`transition-transform duration-300 ${groupOpen(destination.id, node.id) ? 'rotate-180' : ''}`} />'''
)

# Inner children wrapper
content = content.replace(
    '''{node.children.length > 0 && groupOpen(destination.id, node.id) ? (\n                            <div className="mb-1 mr-3 mt-1 space-y-1 border-r border-[#d7e4e2] pr-2">''',
    '''{node.children.length > 0 ? (\n                            <div className={`grid transition-all duration-300 ease-in-out ${groupOpen(destination.id, node.id) ? 'grid-rows-[1fr] opacity-100 mb-1 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>\n                              <div className="overflow-hidden">\n                                <div className="mr-3 space-y-1 border-r border-[#d7e4e2] pr-2">'''
)
content = content.replace(
    '''                            </div>\n                          ) : null}\n                        </div>''',
    '''                                </div>\n                              </div>\n                            </div>\n                          ) : null}\n                        </div>'''
)

# Deepest link styling
content = content.replace(
    '''className={`flex h-10 w-full items-center rounded-lg px-3 text-right text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${''',
    '''className={`flex h-10 w-full items-center rounded-lg px-3 text-right text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${'''
)

with open('apps/web/components/erp/erp-shell.tsx', 'w') as f:
    f.write(content)

