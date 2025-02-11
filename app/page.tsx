"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit2, Moon, Sun, Trash2, ArrowLeft } from "lucide-react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'

type Message = {
  content: string
  isOldSelf: boolean
  timestamp: number
}

type Chat = {
  id: string
  name: string
  messages: Message[]
}

// Add Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCc0oSHlqlX7fLeqqonODsOIC3XA8NI7hc",
  authDomain: "onboarding-a5fcb.firebaseapp.com",
  databaseURL: "https://onboarding-a5fcb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "onboarding-a5fcb",
  storageBucket: "onboarding-a5fcb.appspot.com",
  messagingSenderId: "334607574757",
  appId: "1:334607574757:web:2603a69bf85f4a1e87960c",
  measurementId: "G-2C9J1RY67L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient ? children : null
}

export default function FutureSelfChat() {
  const [chats, setChats] = useState<Chat[]>([])
  const [darkMode, setDarkMode] = useState(true)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState({
    message: "",
    isOldSelf: false,
    editingId: null as string | null,
    editingName: ""
  })
  const [isMobileView, setIsMobileView] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      try {
        // Load chats from solomon collection
        const chatsDoc = await getDoc(doc(firestore, 'solomon', 'chats'))
        if (chatsDoc.exists()) {
          setChats(chatsDoc.data().chats || [])
        }

        // Load settings from solomon collection
        const settingsDoc = await getDoc(doc(firestore, 'solomon', 'settings'))
        if (settingsDoc.exists()) {
          setDarkMode(settingsDoc.data().darkMode ?? false)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function saveChats() {
      try {
        await setDoc(doc(firestore, 'solomon', 'chats'), { chats })
      } catch (error) {
        console.error('Error saving chats:', error)
      }
    }
    if (chats.length > 0) saveChats()
  }, [chats])

  useEffect(() => {
    async function saveDarkMode() {
      try {
        await setDoc(doc(firestore, 'solomon', 'settings'), { darkMode })
      } catch (error) {
        console.error('Error saving dark mode:', error)
      }
    }
    saveDarkMode()
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setChatInput(prev => ({ ...prev, isOldSelf: !prev.isOldSelf }))
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
//
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768) // 768px is the md breakpoint
    }
    
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

  const currentChat = chats.find((chat) => chat.id === currentChatId)

  const createNewChat = () => {
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    const newChat: Chat = {
      id: Date.now().toString(),
      name: today,
      messages: [],
    }
    setChats(prev => [...prev, newChat])
    setCurrentChatId(newChat.id)
  }

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (currentChatId === chatId) setCurrentChatId(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (chatInput.message.trim() && currentChatId) {
      const newMessage: Message = {
        content: chatInput.message.trim(),
        isOldSelf: chatInput.isOldSelf,
        timestamp: Date.now()
      }
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      ))
      setChatInput(prev => ({ ...prev, message: "" }))
    }
  }

  const handleChatNameEdit = (chatId: string, currentName: string) => {
    setChatInput(prev => ({
      ...prev,
      editingId: chatId,
      editingName: currentName
    }))
  }

  const saveChatName = () => {
    if (chatInput.editingId && chatInput.editingName.trim()) {
      setChats(prev => prev.map(chat => 
        chat.id === chatInput.editingId 
          ? { ...chat, name: chatInput.editingName.trim() } 
          : chat
      ))
      setChatInput(prev => ({ ...prev, editingId: null }))
    }
  }

  const handleBackToList = () => {
    setCurrentChatId(null)
  }

  return (
    <ClientOnly>
      <div className={`h-screen ${darkMode ? "dark" : ""}`}>
        {(!isMobileView || !currentChatId) && (
          <div className="w-full md:w-72 bg-white dark:bg-gray-800 h-full md:fixed left-0 top-0 p-4 md:p-6 border-r border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <Button 
                onClick={createNewChat} 
                variant="outline" 
                className="flex-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm md:text-base"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> New Chat
              </Button>
              
            </div>
            <ScrollArea className="h-[calc(100vh-5rem)]">
              {chats.map((chat) => (
                <div key={chat.id} className="mb-2 md:mb-3">
                  {chatInput.editingId === chat.id ? (
                    <div className="flex">
                      <Input
                        value={chatInput.editingName}
                        onChange={(e) => setChatInput(prev => ({ ...prev, editingName: e.target.value }))}
                        onBlur={saveChatName}
                        onKeyPress={(e) => e.key === "Enter" && saveChatName()}
                        className="dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      className={`group flex justify-between items-center p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        currentChatId === chat.id
                          ? "bg-blue-50 dark:bg-blue-900/50 shadow-sm"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setCurrentChatId(chat.id)}
                    >
                      <span className="dark:text-white truncate flex-1 font-medium text-sm md:text-base">{chat.name}</span>
                      <div className="flex md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleChatNameEdit(chat.id, chat.name)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/50"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteChat(chat.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        {(!isMobileView || currentChatId) && (
          <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full ${!isMobileView && 'md:ml-72'}`}>
            <Card className="flex-1 m-2 md:m-6 shadow-lg border-0 dark:bg-gray-800">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b dark:border-gray-700 pb-4 space-y-3 md:space-y-0">
                <div className="flex items-center w-full md:w-auto">
                  {isMobileView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToList}
                      className="mr-2 md:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <CardTitle className="dark:text-white text-lg md:text-xl font-semibold">
                    {currentChat?.name || "Select or create a chat"}
                  </CardTitle>
                </div>
                <div 
                  className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-2 md:p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-full md:w-auto active:bg-gray-300 dark:active:bg-gray-500"
                  onClick={() => setChatInput(prev => ({ ...prev, isOldSelf: !prev.isOldSelf }))}
                >
                  <Switch 
                    id="persona-switch" 
                    checked={chatInput.isOldSelf} 
                    onCheckedChange={(checked) => setChatInput(prev => ({ ...prev, isOldSelf: checked }))}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label 
                    htmlFor="persona-switch" 
                    className={`dark:text-white ${chatInput.isOldSelf ? 'font-semibold' : ''} cursor-pointer text-sm md:text-base flex-1`}
                  >
                    {chatInput.isOldSelf ? "85-Year-Old Self" : "Current Self"}
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Tap to switch {chatInput.isOldSelf ? "back" : "persona"}
                    </span>
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <ScrollArea className="h-[calc(100vh-24rem)] md:h-[calc(100vh-20rem)]">
                  {currentChat?.messages.map((message, index) => (
                    <div key={index} className={`mb-4 md:mb-6 flex ${message.isOldSelf ? "justify-start" : "justify-end"}`}>
                      <div className={`flex flex-col ${message.isOldSelf ? "items-start" : "items-end"}`}>
                        <span
                          className={`inline-block p-3 md:p-4 rounded-2xl text-base md:text-lg max-w-[90%] md:max-w-[80%] shadow-sm ${
                            message.isOldSelf
                              ? "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {message.content}
                        </span>
                        <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 md:mt-2 px-1">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t dark:border-gray-700 p-3 md:p-6">
                <form onSubmit={handleSubmit} className="flex w-full space-x-2 md:space-x-3">
                  <Input
                    value={chatInput.message}
                    onChange={(e) => setChatInput(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={currentChatId ? "Type your message..." : "Select a chat to start messaging"}
                    disabled={!currentChatId}
                    className="dark:bg-gray-700 dark:text-white text-base md:text-lg p-4 md:p-6 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    type="submit" 
                    disabled={!currentChatId}
                    className="px-4 md:px-8 bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Send
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </ClientOnly>
  )
}

