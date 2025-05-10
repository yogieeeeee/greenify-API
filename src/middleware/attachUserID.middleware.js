const attachUserId = (fieldName) => {
  return (req, res, next) => {
    // Check if the user object exists in the request (set by a previous authentication middleware)
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated"
      })
    }

    // Attach the user's id to the request body under the specified field name
    req.body[fieldName] = req.user.id
    console.log(fieldName)
    next()
  }
}

export default attachUserId
